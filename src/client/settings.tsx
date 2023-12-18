"use client"

import { createContext, useRef, useContext, useEffect } from "react"
import { create, useStore as useZustandStore } from "zustand"
import { combine } from "zustand/middleware"

import defaultSettings from "../defaultSettings"

const createStore = ({
	hourHeight,
	roomsInView,
	maxRoomsInView,
}: {
	hourHeight?: number
	roomsInView?: number
	maxRoomsInView: number
}) =>
	create(
		combine(
			{
				...defaultSettings,
				hourHeight: hourHeight ?? 140,
				roomsInView: roomsInView ?? 5,
				maxRoomsInView,
			},
			(set, get) => ({
				incrementHourHeight: () => {
					set((state) => ({ hourHeight: state.hourHeight + 20 }))

					document.cookie = `hour_height=${get().hourHeight}`
				},
				decrementHourHeight: () => {
					set((state) => ({
						hourHeight: Math.max(state.hourHeight - 20, 100),
					}))

					document.cookie = `hour_height=${get().hourHeight}`
				},
				incrementRoomsInView: () => {
					set((state) => ({
						roomsInView: Math.min(
							state.roomsInView + 1,
							get().maxRoomsInView,
						),
					}))

					document.cookie = `rooms_in_view=${get().roomsInView}`
				},
				decrementRoomsInView: () => {
					set((state) => ({
						roomsInView: Math.max(state.roomsInView - 1, 1),
					}))

					document.cookie = `rooms_in_view=${get().roomsInView}`
				},
				constrainRoomsInView: () => {
					set((state) => ({
						roomsInView: Math.max(
							1,
							Math.min(state.roomsInView, get().maxRoomsInView),
						),
					}))

					document.cookie = `rooms_in_view=${get().roomsInView}`
				},
			}),
		),
	)

type Store = ReturnType<typeof createStore>

const StoreContext = createContext<Store | undefined>(undefined)

interface SettingsProviderProps extends React.PropsWithChildren {
	hourHeight?: number
	roomsInView?: number
	maxRoomsInView: number
}

export function SettingsProvider({
	children,
	hourHeight,
	roomsInView,
	maxRoomsInView,
}: SettingsProviderProps) {
	const storeRef = useRef<Store>()

	if (storeRef.current === undefined) {
		storeRef.current = createStore({
			hourHeight,
			roomsInView,
			maxRoomsInView,
		})
	}

	useEffect(() => {
		storeRef.current?.setState({
			maxRoomsInView,
		})

		storeRef.current?.getState().constrainRoomsInView()
	}, [maxRoomsInView])

	return (
		<StoreContext.Provider value={storeRef.current}>
			{children}
		</StoreContext.Provider>
	)
}

function useStore<T>(selector: (state: ReturnType<Store["getState"]>) => T): T {
	const store = useContext(StoreContext)

	if (store === undefined) {
		throw new Error("Missing SettingsProvider in tree")
	}

	return useZustandStore(store, selector)
}

export function useSettings() {
	return useStore((state) => state)
}
