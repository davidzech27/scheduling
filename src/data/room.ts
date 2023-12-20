"use server"

import z from "zod"
import { eq, sql, and, lt, desc } from "drizzle-orm"

import action from "./action"
import loader from "./loader"
import db from "~/db/db"
import { room, booking } from "~/db/schema"

export type Room = Awaited<ReturnType<typeof filter>>[number]

const tagsSchema = z.string().array()

function parseTags(tagsString: string) {
	try {
		return tagsSchema.parse(JSON.parse(tagsString))
	} catch (_) {
		return []
	}
}

export const filter = loader.authed(
	z.object({
		facilityName: z.string(),
	}),
)(async ({ facilityName }, { user: { username, role } }) => {
	const [rooms, roomsWithMinutesUsed] = await Promise.all([
		db
			.select({
				name: room.name,
				tags: room.tags,
				flag: room.flag,
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

	const nameToMinutesUsedMap = new Map<string, number>(
		roomsWithMinutesUsed.map((room) => [room.name, room.minutesUsed]),
	)

	return rooms.map((room) => ({
		name: room.name,
		tags: parseTags(room.tags),
		flag: room.flag ?? undefined,
		minutesUsed: nameToMinutesUsedMap.get(room.name) ?? 0,
	}))
})

export const update = action.authed(
	z.object({
		name: z.string(),
		tags: z.string().array().optional(),
		flag: z.string().or(z.null()).optional(),
	}),
)(async ({ name, tags, flag }, { filter: { facilityName } }) => {
	try {
		const [existingRow] = await db
			.select({
				tags: room.tags,
				flag: room.flag,
			})
			.from(room)
			.where(
				and(eq(room.facilityName, facilityName), eq(room.name, name)),
			)

		await db
			.update(room)
			.set({
				tags: JSON.stringify(tags),
				flag,
			})
			.where(
				and(eq(room.facilityName, facilityName), eq(room.name, name)),
			)

		const existingTags = parseTags(existingRow?.tags ?? "[]")

		const updateType =
			flag === null &&
			existingRow?.flag !== null &&
			(tags === undefined ||
				(tags.length === existingTags.length &&
					tags?.every((tag, index) => tag === existingTags[index])))
				? ("FlagResolved" as const)
				: typeof flag === "string" &&
				    (tags === undefined ||
							(tags.length === existingTags.length &&
								tags?.every(
									(tag, index) => tag === existingTags[index],
								)))
				  ? ("FlagSet" as const)
				  : (tags?.length ?? 0) > (existingTags.length ?? 0)
				    ? ("TagAdded" as const)
				    : (tags?.length ?? 0) < (existingTags.length ?? 0)
				      ? ("TagRemoved" as const)
				      : (tags?.length ?? 0) === (existingTags.length ?? 0)
				        ? ("TagUpdated" as const)
				        : ("Other" as const)

		return {
			status: "success" as const,
			message: {
				FlagResolved: "Flag resolved.",
				FlagSet: "Flag set.",
				TagAdded: "Tag added.",
				TagRemoved: "Tag removed.",
				TagUpdated: "Tag updated.",
				Other: "Room updated.",
			}[updateType],
			oldFlag:
				updateType === "FlagResolved" ? existingRow?.flag : undefined,
		}
	} catch (error) {
		console.error(error)

		const [existingRow] = await db
			.select({
				name: room.name,
				tags: room.tags,
				flag: room.flag,
			})
			.from(room)
			.where(eq(room.name, name))

		if (existingRow === undefined) {
			throw new Error("Existing row not found")
		}

		return {
			status: "error" as const,
			message: "Failed to update room.",
			room: {
				name: existingRow.name,
				tags: parseTags(existingRow.tags),
				flag: existingRow.flag ?? undefined,
			},
		}
	}
})
