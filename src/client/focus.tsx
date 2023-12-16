import { create } from "zustand"
import { combine } from "zustand/middleware"

type Focused =
	| {
			type: "booking"
			id: number
	  }
	| {
			type: "draft"
	  }
	| {
			type: "room"
			name: string
	  }
	| {
			type: "user"
			username: string
	  }

const useStore = create(
	combine(
		{
			focused: undefined as Focused | undefined,
			unfocusTimeout: undefined as NodeJS.Timeout | undefined,
		},
		(set, get) => ({
			focus: (focused: Focused) => {
				clearTimeout(get().unfocusTimeout)

				set({
					focused,
					unfocusTimeout: undefined,
				})
			},
			unfocus: () => {
				set({
					unfocusTimeout: setTimeout(() => {
						set({
							focused: undefined,
						})
					}, 0),
				})
			},
		}),
	),
)

export function useFocusedEntity() {
	return useStore((state) => state.focused)
}

export function useFocusEntity() {
	return useStore((state) => state.focus)
}

export function useUnfocus() {
	return useStore((state) => state.unfocus)
}
