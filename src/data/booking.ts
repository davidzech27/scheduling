"use server"

import { unstable_noStore as noStore } from "next/cache"
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

	if (startAt.getDate() !== endAt.getDate()) {
		return {
			valid: false as const,
			message: "Bookings across multiple days are not yet supported.",
		}
	}

	if (startAt.getDate() < new Date().getDate() && user.role === "provider") {
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
			.select({ id: booking.id })
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
)(async ({ facilityName, date }) => {
	noStore()

	const startOfDay = new Date(date.setHours(0, 0, 0, 0))
	const endOfDay = new Date(date.setHours(23, 59, 59, 999))
	console.log(new Date())
	const bookings = await db
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

	console.log(bookings)

	return bookings
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
	{ user, filter: { facilityName } },
) => {
	noStore()

	try {
		let response = undefined as
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
					response = {
						status: "error" as const,
						message: validation.message,
					}

					tx.rollback()
				}
			})
		} catch (e) {
			if (e instanceof TransactionRollbackError) {
				return response
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
	{ user },
) => {
	noStore()

	try {
		let response = undefined as
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
					response = {
						status: "error" as const,
						message: validation.message,
						booking: existingRow,
					}

					tx.rollback()
				}
			})
		} catch (e) {
			if (e instanceof TransactionRollbackError) {
				return response
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
	noStore()

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
