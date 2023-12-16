"use server"

import { revalidatePath } from "next/cache"
import z from "zod"

import action from "./action"

export const get = action.authed(async ({ filter }) => {
	return Promise.resolve(filter)
})

export const update = action.authed(
	z.object({
		facilityName: z.string().optional(),
		date: z.date().optional(),
	}),
)(async ({ facilityName, date }, { filter, setFilter }) => {
	await setFilter({
		facilityName: facilityName ?? filter.facilityName,
		date: date ?? filter.date,
	})

	revalidatePath("/")
})
