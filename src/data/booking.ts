"use server"

import z from "zod"
import {
	eq,
	gte,
	lte,
	and,
	lt,
	gt,
	TransactionRollbackError,
} from "drizzle-orm"

import action from "./action"
import loader from "./loader"
import db from "~/db/db"
import { booking } from "~/db/schema"
import { update as updateFilter } from "./filter"

export type Booking = Awaited<ReturnType<typeof filter>>[number]

async function validate(
	{
		id,
		facilityName,
		roomName,
		startAt,
		endAt,
		username,
	}: {
		id?: number
		facilityName: string
		roomName: string
		startAt: Date
		endAt: Date
		username: string
	},
	user: {
		username: string
		role: "provider" | "staff" | "admin"
	},
	timezoneOffset: number,
	tx?: Exclude<
		Parameters<Parameters<typeof db.transaction>[0]>,
		undefined
	>[0],
) {
	const validateDB = tx ?? db

	if (startAt.getTime() >= endAt.getTime()) {
		return {
			valid: false as const,
			message: "Booking must have a duration.",
		}
	}

	if (
		new Date(
			new Date(
				startAt.getTime() - timezoneOffset * 60 * 1000,
			).setUTCHours(0, 0, 0),
		).getUTCDate() !==
		new Date(
			new Date(endAt.getTime() - timezoneOffset * 60 * 1000).setUTCHours(
				0,
				0,
				0,
			),
		).getUTCDate()
	) {
		return {
			valid: false as const,
			message: "Bookings across multiple days are not yet supported.",
		}
	}

	if (
		new Date(
			new Date(
				startAt.getTime() - timezoneOffset * 60 * 1000,
			).setUTCHours(0, 0, 0),
		).getUTCDate() <
			new Date(
				new Date(
					new Date().getTime() - timezoneOffset * 60 * 1000,
				).setUTCHours(0, 0, 0),
			).getUTCDate() &&
		user.role === "provider"
	) {
		return {
			valid: false as const,
			message: "Bookings for previous days can't be created or updated.",
		}
	}

	const [roomConflictingRows, userConflictingRows] = await Promise.all([
		validateDB
			.select({ id: booking.id })
			.from(booking)
			.where(
				and(
					eq(booking.facilityName, facilityName),
					eq(booking.roomName, roomName),
					lt(booking.startAt, endAt),
					gt(booking.endAt, startAt),
				),
			),
		validateDB
			.select()
			.from(booking)
			.where(
				and(
					eq(booking.username, username),
					lt(booking.startAt, endAt),
					gt(booking.endAt, startAt),
				),
			),
	])

	if (roomConflictingRows.some((row) => row.id !== id)) {
		return {
			valid: false as const,
			message: "Booking can't overlap with other bookings.",
		}
	}

	if (userConflictingRows.some((row) => row.id !== id)) {
		return {
			valid: false as const,
			message: "User can't be in multiple places at once.",
		}
	}

	return { valid: true as const }
}

export const filter = loader.authed(
	z.object({
		facilityName: z.string(),
		date: z.date(),
	}),
)(async ({ facilityName, date }, { timezoneOffset }) => {
	const startOfDay = new Date(
		new Date(date.getTime() - timezoneOffset * 60 * 1000).setUTCHours(
			0,
			0,
			0,
		) +
			timezoneOffset * 60 * 1000,
	)
	const endOfDay = new Date(
		new Date(date.getTime() - timezoneOffset * 60 * 1000).setUTCHours(
			23,
			59,
			59,
		) +
			timezoneOffset * 60 * 1000,
	)

	return await db
		.select({
			id: booking.id,
			roomName: booking.roomName,
			startAt: booking.startAt,
			endAt: booking.endAt,
			username: booking.username,
		})
		.from(booking)
		.where(
			and(
				eq(booking.facilityName, facilityName),
				gte(booking.startAt, startOfDay),
				lte(booking.startAt, endOfDay),
			),
		)
})

export const create = action.authed(
	z.object({
		id: z.number().optional(),
		roomName: z.string(),
		startAt: z.date(),
		endAt: z.date(),
		username: z.string(),
	}),
)(async (
	{ id, roomName, startAt, endAt, username },
	{ user, filter: { facilityName }, timezoneOffset },
) => {
	try {
		let errorResponse = undefined as
			| {
					status: "error"
					message: string
			  }
			| undefined

		try {
			return await db.transaction(async (tx) => {
				const [[createdRow], validation] = await Promise.all([
					tx
						.insert(booking)
						.values({
							id,
							facilityName,
							roomName,
							startAt,
							endAt,
							username,
						})
						.returning(),
					validate(
						{
							id,
							facilityName,
							roomName,
							startAt,
							endAt,
							username,
						},
						user,
						timezoneOffset,
						tx,
					),
				])

				if (validation.valid) {
					if (createdRow === undefined) {
						throw new Error("Created row is undefined")
					}

					await updateFilter({
						facilityName,
						date: startAt,
					})

					return {
						status: "success" as const,
						message: "Booking created.",
						booking: createdRow,
					}
				} else {
					errorResponse = {
						status: "error" as const,
						message: validation.message,
					}

					tx.rollback()
				}
			})
		} catch (e) {
			if (e instanceof TransactionRollbackError) {
				return errorResponse
			} else {
				throw e
			}
		}
	} catch (error) {
		console.error(error)

		return {
			status: "error" as const,
			message: "Failed to create booking.",
		}
	}
})

export const update = action.authed(
	z.object({
		id: z.number(),
		facilityName: z.string().optional(),
		roomName: z.string().optional(),
		startAt: z.date().optional(),
		endAt: z.date().optional(),
		username: z.string().optional(),
	}),
)(async (
	{ id, facilityName, roomName, startAt, endAt, username },
	{ user, timezoneOffset },
) => {
	try {
		let errorResponse = undefined as
			| {
					status: "error"
					message: string
					booking: {
						id: number
						facilityName: string
						roomName: string
						startAt: Date
						endAt: Date
						username: string
					}
			  }
			| undefined

		try {
			return await db.transaction(async (tx) => {
				const [, { validation, existingRow }] = await Promise.all([
					tx
						.update(booking)
						.set({
							facilityName,
							roomName,
							startAt,
							endAt,
							username,
						})
						.where(eq(booking.id, id)),
					tx
						.select({
							id: booking.id,
							facilityName: booking.facilityName,
							roomName: booking.roomName,
							startAt: booking.startAt,
							endAt: booking.endAt,
							username: booking.username,
						})
						.from(booking)
						.where(eq(booking.id, id))
						.then(async ([existingRow]) => {
							if (existingRow === undefined) {
								throw new Error("Existing row not found")
							}

							return {
								validation: await validate(
									{
										id,
										facilityName:
											facilityName ??
											existingRow.facilityName,
										roomName:
											roomName ?? existingRow.roomName,
										startAt: startAt ?? existingRow.startAt,
										endAt: endAt ?? existingRow.endAt,
										username:
											username ?? existingRow.username,
									},
									user,
									timezoneOffset,
									tx,
								),
								existingRow,
							}
						}),
				])

				if (validation.valid) {
					await updateFilter({
						facilityName,
						date: startAt,
					})

					return {
						status: "success" as const,
						message: "Booking updated.",
					}
				} else {
					errorResponse = {
						status: "error" as const,
						message: validation.message,
						booking: existingRow,
					}

					tx.rollback()
				}
			})
		} catch (e) {
			if (e instanceof TransactionRollbackError) {
				return errorResponse
			} else {
				throw e
			}
		}
	} catch (error) {
		console.error(error)

		const [existingRow] = await db
			.select({
				id: booking.id,
				facilityName: booking.facilityName,
				roomName: booking.roomName,
				startAt: booking.startAt,
				endAt: booking.endAt,
				username: booking.username,
			})
			.from(booking)
			.where(eq(booking.id, id))

		if (existingRow === undefined) {
			throw new Error("Existing row not found")
		}

		return {
			status: "error" as const,
			message: "Failed to update booking.",
			booking: existingRow,
		}
	}
})

export const _delete = action.authed(
	z.object({
		id: z.number(),
	}),
)(async ({ id }) => {
	try {
		await db.delete(booking).where(eq(booking.id, id))

		return {
			status: "success" as const,
			message: "Booking deleted.",
		}
	} catch (error) {
		console.error(error)

		return {
			status: "error" as const,
			message: "Failed to delete booking.",
		}
	}
})
