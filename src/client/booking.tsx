"use client"

import {
	createContext,
	useRef,
	useContext,
	useCallback,
	useEffect,
} from "react"
import { create, useStore as useZustandStore } from "zustand"
import { combine } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import { useShallow } from "zustand/react/shallow"

import data from "~/data/data"
import { type Booking } from "~/data/booking"
import { useShowToast } from "~/components/Toast"
import { useCurrentUser } from "./user"
import { useFocusEntity, useFocusedEntity, useUnfocus } from "./focus"

const createStore = ({ bookings }: { bookings: Booking[] }) =>
	create(
		immer(
			combine(
				{
					bookings,
					draft: {} as Partial<Omit<Booking, "id">>,
				},
				(set, get) => ({
					get: ({ id }: { id: number }) => {
						return get().bookings.find(
							(booking) => booking.id === id,
						)
					},
					add: (booking: Booking) => {
						set((state) => {
							state.bookings.push(booking)
						})
					},
					update: (
						booking: { id: number } & Partial<Omit<Booking, "id">>,
					) => {
						set((state) => {
							const updatedIndex = state.bookings.findIndex(
								({ id }) => id === booking.id,
							)

							const updatedBooking = state.bookings[updatedIndex]

							if (updatedBooking === undefined) return

							if (
								(booking.roomName !== undefined &&
									booking.roomName !==
										updatedBooking.roomName) ||
								(booking.startAt !== undefined &&
									booking.startAt !==
										updatedBooking.startAt) ||
								(booking.endAt !== undefined &&
									booking.endAt !== updatedBooking.endAt) ||
								(booking.username !== undefined &&
									booking.username !==
										updatedBooking.username)
							) {
								state.bookings[updatedIndex] = {
									id: booking.id,
									roomName:
										booking.roomName ??
										updatedBooking.roomName,
									startAt:
										booking.startAt ??
										updatedBooking.startAt,
									endAt:
										booking.endAt ?? updatedBooking.endAt,
									username:
										booking.username ??
										updatedBooking.username,
								}
							}
						})
					},
					remove: ({ id }: { id: number }) => {
						set((state) => {
							const deletedIndex = state.bookings.findIndex(
								(booking) => booking.id === id,
							)

							state.bookings.splice(deletedIndex, 1)
						})
					},
					getDraft: () => {
						return get().draft
					},
					updateDraft: (draft: Partial<Omit<Booking, "id">>) => {
						set((state) => {
							if (
								(draft.roomName !== undefined &&
									draft.roomName !== state.draft.roomName) ||
								(draft.username !== undefined &&
									draft.username !== state.draft.username) ||
								(draft.startAt !== undefined &&
									draft.startAt !== state.draft.startAt) ||
								(draft.endAt !== undefined &&
									draft.endAt !== state.draft.endAt)
							) {
								state.draft = {
									roomName:
										draft.roomName ?? state.draft.roomName,
									startAt:
										draft.startAt ?? state.draft.startAt,
									endAt: draft.endAt ?? state.draft.endAt,
									username:
										draft.username ?? state.draft.username,
								}
							}
						})
					},
					deleteDraft: () => {
						set({
							draft: {},
						})
					},
				}),
			),
		),
	)

type Store = ReturnType<typeof createStore>

const StoreContext = createContext<Store | undefined>(undefined)

interface BookingProviderProps extends React.PropsWithChildren {
	bookings: Booking[]
}

export function BookingProvider({ children, bookings }: BookingProviderProps) {
	const storeRef = useRef<Store>()

	if (storeRef.current === undefined) {
		storeRef.current = createStore({ bookings })
	}

	useEffect(() => {
		storeRef.current?.setState({ bookings })
	}, [bookings])

	return (
		<StoreContext.Provider value={storeRef.current}>
			{children}
		</StoreContext.Provider>
	)
}

function useStore<T>(selector: (state: ReturnType<Store["getState"]>) => T): T {
	const store = useContext(StoreContext)

	if (store === undefined) {
		throw new Error("Missing BookingProvider in tree")
	}

	return useZustandStore(store, selector)
}

export function useBookingIds() {
	return useStore(
		useShallow(({ bookings }) => bookings.map((booking) => booking.id)),
	)
}

export function useBooking({ id }: { id: number }) {
	const booking = useStore(useCallback((state) => state.get({ id }), [id]))

	const get = useStore((state) => state.get)
	const add = useStore((state) => state.add)
	const update = useStore((state) => state.update)
	const remove = useStore((state) => state.remove)

	const focusedEntity = useFocusedEntity()
	const focused = focusedEntity?.type === "booking" && focusedEntity.id === id

	const focusEntity = useFocusEntity()

	const unfocus = useUnfocus()

	const showToast = useShowToast()

	const callbacks = {
		edit: useCallback(
			(booking: Omit<Parameters<typeof update>[0], "id">) => {
				update({ id, ...booking })
			},
			[update, id],
		),
		save: useCallback(async () => {
			const booking = get({ id })

			if (booking === undefined) return

			const response = await data.booking.update(booking)

			if (response?.status === "error") {
				update(response.booking)
			}

			if (
				response?.status !== undefined &&
				response.message !== undefined
			) {
				showToast({
					text: response.message,
					variant: response.status,
				})
			}
		}, [get, update, showToast, id]),
		delete: useCallback(async () => {
			const booking = get({ id })

			if (booking === undefined) {
				throw new Error(`Booking with id ${id} not found`)
			}

			remove({ id })

			const response = await data.booking.delete({ id })

			if (response?.status === "error") {
				add(booking)
			} else {
				unfocus()
			}

			if (
				response?.status !== undefined &&
				response.message !== undefined
			) {
				showToast({
					text: response.message,
					variant: response.status,
					action:
						response.status === "success"
							? {
									text: "Undo",
									callback: () => {
										void data.booking
											.create(booking)
											.then((response) => {
												if (
													response?.status !==
														"error" &&
													response !== undefined
												) {
													add(response.booking)

													focusEntity({
														type: "booking",
														id: response.booking.id,
													})
												}

												if (
													response?.status !==
														undefined &&
													response?.message !==
														undefined
												) {
													showToast({
														text: response.message,
														variant:
															response.status,
													})
												}
											})
									},
							  }
							: undefined,
				})
			}
		}, [get, remove, add, unfocus, showToast, id, focusEntity]),
		focus: useCallback(() => {
			focusEntity({ type: "booking", id })
		}, [focusEntity, id]),
	}

	return (
		booking && {
			...booking,
			focused,
			...callbacks,
		}
	)
}

export function useFocusedBooking() {
	const focusedEntity = useFocusedEntity()

	return useBooking({
		id: focusedEntity?.type === "booking" ? focusedEntity.id : -1,
	})
}

export function useDraftBooking() {
	const draft = useStore((state) => state.draft)

	const getDraft = useStore((state) => state.getDraft)
	const updateDraft = useStore((state) => state.updateDraft)
	const deleteDraft = useStore((state) => state.deleteDraft)

	const addBooking = useStore((state) => state.add)

	const focusedEntity = useFocusedEntity()
	const focused = focusedEntity?.type === "draft"

	const focusEntity = useFocusEntity()

	const unfocus = useUnfocus()

	const showToast = useShowToast()

	const callbacks = {
		edit: useCallback(
			(draft: Parameters<typeof updateDraft>[0]) => {
				updateDraft(draft)

				focusEntity({ type: "draft" })
			},
			[updateDraft, focusEntity],
		),
		create: useCallback(async () => {
			const draft = getDraft()

			if (
				draft.roomName !== undefined &&
				draft.startAt !== undefined &&
				draft.endAt !== undefined &&
				draft.username !== undefined
			) {
				const response = await data.booking.create({
					roomName: draft.roomName,
					startAt: draft.startAt,
					endAt: draft.endAt,
					username: draft.username,
				})

				if (response?.status !== "error" && response !== undefined) {
					deleteDraft()

					addBooking(response.booking)

					focusEntity({
						type: "booking",
						id: response.booking.id,
					})
				}

				if (
					response?.status !== undefined &&
					response?.message !== undefined
				) {
					showToast({
						text: response.message,
						variant: response.status,
					})
				}
			}
		}, [getDraft, deleteDraft, addBooking, focusEntity, showToast]),
		discard: useCallback(() => {
			deleteDraft()
			unfocus()
		}, [deleteDraft, unfocus]),
		focus: useCallback(() => {
			focusEntity({ type: "draft" })
		}, [focusEntity]),
	}

	return {
		...draft,
		focused,
		...callbacks,
	}
}

export function useNextBooking() {
	const { username } = useCurrentUser()

	return useStore((state) =>
		state.bookings.reduce<Booking | undefined>(
			(prev, cur) =>
				cur.username === username &&
				cur.endAt > new Date() &&
				(prev === undefined || cur.endAt < prev.endAt)
					? cur
					: prev,
			undefined,
		),
	)
}
