import { cookies } from "next/headers"

import * as jose from "jose"
import z from "zod"

import env from "~/env.js"

const authorizationCookieKey = "Authorization"

const jwtPayloadSchema = z.object({
	username: z.string(),
	name: z.string(),
	role: z.enum(["provider", "staff", "admin"]),
	filter: z.object({
		facilityName: z.string(),
		date: z.coerce.date(),
	}),
})

export type JWTPayload = z.infer<typeof jwtPayloadSchema>

async function encodeJWTPayload(jwtPayload: JWTPayload) {
	return await new jose.SignJWT(jwtPayload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.sign(new TextEncoder().encode(env.JWT_SECRET))
}

async function decodeJWTPayload(encodedJWTPayload: string) {
	return jwtPayloadSchema.parse(
		(
			await jose.jwtVerify(
				encodedJWTPayload,
				new TextEncoder().encode(env.JWT_SECRET),
			)
		).payload,
	)
}

export async function getJWTPayload() {
	const authorization = cookies().get(authorizationCookieKey)?.value

	if (authorization === undefined) return undefined

	const encodedJWTPayload = authorization.replace("Bearer ", "")

	try {
		const jwtPayload = await decodeJWTPayload(encodedJWTPayload)

		return jwtPayload
	} catch (error) {
		return undefined
	}
}

export async function setJWTPayload(jwtPayload: JWTPayload | undefined) {
	if (jwtPayload !== undefined) {
		const encodedJWTPayload = await encodeJWTPayload(jwtPayload)

		const authorization = `Bearer ${encodedJWTPayload}`

		cookies().set({
			name: authorizationCookieKey,
			value: authorization,
			httpOnly: true,
			sameSite: true,
			expires: new Date().valueOf() + 1000 * 60 * 60 * 24 * 400,
			secure: env.NODE_ENV === "production",
		})
	} else {
		cookies().delete(authorizationCookieKey)
	}
}
