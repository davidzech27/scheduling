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
import Fuse from "fuse.js"

import data from "~/data/data"
import { type Room } from "~/data/room"
import { useFocusEntity, useFocusedEntity } from "./focus"
import { useShowToast } from "~/components/Toast"

const createStore = ({ rooms }: { rooms: Room[] }) =>
	create(
		immer(
			combine(
				{
					rooms,
					fuse: new Fuse(rooms, {
						keys: [{ name: "name", weight: 1 }],
					}),
				},
				(set, get) => ({
					get: ({ name }: { name: string }) => {
						return get().rooms.find((room) => room.name === name)
					},
					update: (
						room: { name: string } & Partial<
							Omit<Room, "name" | "flag" | "minutesUsed"> & {
								flag: string | null
							}
						>,
					) => {
						set((state) => {
							const updatedIndex = state.rooms.findIndex(
								({ name }) => name === room.name,
							)

							const updatedRoom = state.rooms[updatedIndex]

							if (updatedRoom === undefined) return

							if (
								(room.tags !== undefined &&
									room.tags !== updatedRoom.tags) ||
								(room.flag !== undefined &&
									room.flag !== updatedRoom.flag)
							) {
								state.rooms[updatedIndex] = {
									name: updatedRoom.name,
									tags: room.tags ?? updatedRoom.tags,
									flag:
										room.flag === null
											? undefined
											: room.flag ?? updatedRoom.flag,
									minutesUsed: updatedRoom.minutesUsed,
								}
							}
						})
					},
					search: ({ text }: { text: string }) => {
						return get()
							.fuse.search(text)
							.map((result) => result.item)
					},
				}),
			),
		),
	)

type Store = ReturnType<typeof createStore>

const StoreContext = createContext<Store | undefined>(undefined)

interface RoomProviderProps extends React.PropsWithChildren {
	rooms: Room[]
}

export function RoomProvider({ children, rooms }: RoomProviderProps) {
	const storeRef = useRef<Store>()

	if (storeRef.current === undefined) {
		storeRef.current = createStore({ rooms })
	}

	useEffect(() => {
		storeRef.current?.setState({ rooms })
	}, [rooms])

	return (
		<StoreContext.Provider value={storeRef.current}>
			{children}
		</StoreContext.Provider>
	)
}

function useStore<T>(selector: (state: ReturnType<Store["getState"]>) => T): T {
	const store = useContext(StoreContext)

	if (store === undefined) {
		throw new Error("Missing RoomProvider in tree")
	}

	return useZustandStore(store, selector)
}

export function useRooms() {
	const rooms = useStore((state) => state.rooms)

	const focusedEntity = useFocusedEntity()
	const focusedName =
		focusedEntity?.type === "room" ? focusedEntity.name : undefined

	const focusEntity = useFocusEntity()

	return rooms.map((room) => ({
		...room,
		focused: room.name === focusedName,
		focus: () => {
			focusEntity({
				type: "room",
				name: room.name,
			})
		},
	}))
}

export function useRoom({ name }: { name: string }) {
	const room = useStore((state) => state.get({ name }))

	const get = useStore((state) => state.get)

	const update = useStore((state) => state.update)

	const focusedEntity = useFocusedEntity()

	const focusEntity = useFocusEntity()

	const showToast = useShowToast()

	const callbacks = {
		edit: useCallback(
			(
				room: Omit<
					Parameters<typeof update>[0],
					"name" | "minutesUsed"
				>,
			) => {
				update({ name, ...room })
			},
			[update, name],
		),
		save: useCallback(async () => {
			const room = get({ name })

			if (room === undefined) return

			const response = await data.room.update({
				...room,
				flag: room.flag ?? null,
			})

			if (response?.status === "error") {
				update(response.room)
			}

			if (
				response?.status !== undefined &&
				response.message !== undefined
			) {
				showToast({
					text: response.message,
					variant: response.status,
					action:
						response.oldFlag !== undefined
							? {
									text: "Undo",
									callback: () => {
										update({
											name,
											flag: response.oldFlag,
										})

										void callbacks.save()
									},
							  }
							: undefined,
				})
			}
			// callbacks.save can't be put here
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [get, name, update, showToast]),
		focus: useCallback(() => {
			if (room === undefined) return

			focusEntity({
				type: "room",
				name: room.name,
			})
		}, [focusEntity, room]),
	}

	if (room === undefined) return undefined

	return {
		...room,
		focused:
			focusedEntity?.type === "room" && focusedEntity.name === room.name,
		...callbacks,
	}
}

export function useFocusedRoom() {
	const focusedEntity = useFocusedEntity()

	return useRoom({
		name: focusedEntity?.type === "room" ? focusedEntity.name : "",
	})
}

export function useSearchRooms({ text }: { text: string }) {
	return useStore(useCallback((state) => state.search({ text }), [text]))
}
