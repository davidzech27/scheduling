"use server"

import z from "zod"
import { and, desc, eq, lt, sql } from "drizzle-orm"

import loader from "./loader"
import db from "~/db/db"
import { booking, user } from "~/db/schema"

export type User = Awaited<ReturnType<typeof filter>>[number]

export const me = loader.authed(async ({ user }) => {
	return await Promise.resolve(user)
})

export const filter = loader.authed(
	z.object({
		facilityName: z.string(),
	}),
)(async ({ facilityName }) => {
	const [users, usersWithMinutesSpent] = await Promise.all([
		db
			.select({
				username: user.username,
				name: user.name,
				role: user.role,
			})
			.from(user),
		db
			.select({
				username: booking.username,
				minutesSpent: sql<number>`SUM((booking.end_at - booking.start_at) / 60)`,
			})
			.from(booking)
			.where(
				and(
					eq(booking.facilityName, facilityName),
					lt(booking.endAt, new Date()),
				),
			)
			.groupBy(booking.username)
			.orderBy(
				desc(
					sql<number>`SUM((booking.end_at - booking.start_at) / 60)`,
				),
			),
	])

	const usernameToMinutesSpentMap = new Map<string, number>(
		usersWithMinutesSpent.map((user) => [user.username, user.minutesSpent]),
	)

	return users
		.map((user) => ({
			...user,
			minutesSpent: usernameToMinutesSpentMap.get(user.username) ?? 0,
		}))
		.sort((user1, user2) => user2.minutesSpent - user1.minutesSpent)
})
