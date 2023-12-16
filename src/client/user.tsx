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

import { type User } from "~/data/user"
import { useFocusedEntity } from "./focus"

const createStore = ({
	users,
	username,
}: {
	users: User[]
	username: string
}) =>
	create(
		combine(
			{
				users,
				username: username,
				fuse: new Fuse(users, {
					keys: [
						{ name: "username", weight: 0.75 },
						{ name: "name", weight: 1 },
						{ name: "role", weight: 0.5 },
					],
				}),
			},
			(_, get) => ({
				get: ({ username }: { username: string }) => {
					return get().users.find(
						(user) => user.username === username,
					)
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

interface UserProviderProps extends React.PropsWithChildren {
	users: User[]
	username: string
}

export function UserProvider({ children, users, username }: UserProviderProps) {
	const storeRef = useRef<Store>()

	if (storeRef.current === undefined) {
		storeRef.current = createStore({ users, username })
	}

	useEffect(() => {
		storeRef.current?.setState({ users, username })
	}, [users, username])

	return (
		<StoreContext.Provider value={storeRef.current}>
			{children}
		</StoreContext.Provider>
	)
}

function useStore<T>(selector: (state: ReturnType<Store["getState"]>) => T): T {
	const store = useContext(StoreContext)

	if (store === undefined) {
		throw new Error("Missing UserProvider in tree")
	}

	return useZustandStore(store, selector)
}

export function useUser({ username }: { username: string }) {
	return useStore(useCallback((state) => state.get({ username }), [username]))
}

export function useUsers() {
	return useStore(useCallback((state) => state.users, []))
}

export function useSearchUsers({ text }: { text: string }) {
	return useStore(useCallback((state) => state.search({ text }), [text]))
}

export function useCurrentUser() {
	const currentUser = useStore((state) =>
		state.get({ username: state.username }),
	)

	if (currentUser === undefined) {
		throw new Error("Current user not found")
	}

	return currentUser
}

export function useFocusedUser() {
	const focusedEntity = useFocusedEntity()

	return useUser({
		username: focusedEntity?.type === "user" ? focusedEntity.username : "",
	})
}
