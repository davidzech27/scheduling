"use client"

import { createContext, useContext } from "react"

const FilterContext = createContext<{
	date: Date
	facilityName: string
}>({ date: new Date(), facilityName: "" })

interface FilterProviderProps extends React.PropsWithChildren {
	filter: { date: Date; facilityName: string }
}

export function FilterProvider({ children, filter }: FilterProviderProps) {
	return (
		<FilterContext.Provider value={filter}>
			{children}
		</FilterContext.Provider>
	)
}

export function useFilter() {
	return useContext(FilterContext)
}
