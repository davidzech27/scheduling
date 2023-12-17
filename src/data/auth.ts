"use server"

import { redirect } from "next/navigation"
import z from "zod"
import { and, eq } from "drizzle-orm"

import action from "./action"
import db from "~/db/db"
import { user, facility } from "~/db/schema"
import { unstable_noStore as noStore } from "next/cache"

export const signIn = action.unauthed(
	z.object({
		username: z.string(),
		password: z.string(),
		timezoneOffset: z.number(),
	}),
)(async ({ username, password, timezoneOffset }, { setJWTPayload }) => {
	noStore()

	try {
		const [existingUserRow] = await db
			.select({
				name: user.name,
				role: user.role,
			})
			.from(user)
			.where(
				and(eq(user.username, username), eq(user.password, password)),
			)

		if (existingUserRow === undefined) {
			return {
				status: "error" as const,
				message: "Your username or password is incorrect.",
			}
		}

		const [facilityRow] = await db
			.select({
				name: facility.name,
			})
			.from(facility)
			.limit(1)

		if (facilityRow === undefined) {
			throw new Error("No facilities have been created yet.")
		}

		await setJWTPayload({
			username,
			name: existingUserRow.name,
			role: existingUserRow.role,
			filter: {
				facilityName: facilityRow.name,
				date: new Date(
					new Date(
						new Date().getTime() - timezoneOffset * 60 * 1000,
					).setUTCHours(0, 0, 0) +
						timezoneOffset * 60 * 1000,
				),
			},
			timezoneOffset,
		})
	} catch (e) {
		console.error(e)

		return {
			status: "error" as const,
			message: "There was an error signing you in.",
		}
	}

	redirect("/")
})

export const logOut = action.authed(async ({ deleteJWTPayload }) => {
	await deleteJWTPayload()

	redirect("/signin")
})
