"use server"

import z from "zod"
import { eq, sql, and, lt, desc } from "drizzle-orm"

import loader from "./loader"
import db from "~/db/db"
import { room, booking } from "~/db/schema"

export type Room = Awaited<ReturnType<typeof filter>>[number]

export const filter = loader.authed(
	z.object({
		facilityName: z.string(),
	}),
)(async ({ facilityName }, { user: { username, role } }) => {
	const [rooms, roomsWithMinutesUsed] = await Promise.all([
		db
			.select({
				name: room.roomName,
			})
			.from(room)
			.where(eq(room.facilityName, facilityName)),
		db
			.select({
				name: booking.roomName,
				minutesUsed: sql<number>`SUM((booking.end_at - booking.start_at) / 60)`,
			})
			.from(booking)
			.where(
				and(
					role === "provider"
						? eq(booking.username, username)
						: undefined,
					eq(booking.facilityName, facilityName),
					lt(booking.endAt, new Date()),
				),
			)
			.groupBy(booking.roomName)
			.orderBy(
				desc(
					sql<number>`SUM((booking.end_at - booking.start_at) / 60)`,
				),
			),
	])

	const roomNameToMinutesUsedMap = new Map<string, number>(
		roomsWithMinutesUsed.map((room) => [room.name, room.minutesUsed]),
	)

	return rooms
		.map((room) => ({
			...room,
			minutesUsed: roomNameToMinutesUsedMap.get(room.name) ?? 0,
		}))
		.sort((room1, room2) => room2.minutesUsed - room1.minutesUsed)
})
