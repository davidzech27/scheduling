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
import Fuse from "fuse.js"

import { type Room } from "~/data/room"
import { useFocusEntity, useFocusedEntity } from "./focus"

const createStore = ({ rooms }: { rooms: Room[] }) =>
	create(
		combine(
			{
				rooms,
				fuse: new Fuse(rooms, {
					keys: [{ name: "name", weight: 1 }],
				}),
			},
			(_, get) => ({
				get: ({ name }: { name: string }) => {
					return get().rooms.find((room) => room.name === name)
				},
				search: ({ text }: { text: string }) => {
					return get()
						.fuse.search(text)
						.map((result) => result.item)
				},
			}),
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

	const focusedEntity = useFocusedEntity()

	const focusEntity = useFocusEntity()

	const callbacks = {
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
