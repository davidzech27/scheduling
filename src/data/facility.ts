"use server"

import loader from "./loader"
import db from "~/db/db"
import { facility } from "~/db/schema"

export type Facility = Awaited<ReturnType<typeof all>>[number]

export const all = loader.authed(async () => {
	return await db.select({ name: facility.name }).from(facility)
})
