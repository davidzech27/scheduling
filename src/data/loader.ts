import { redirect } from "next/navigation"
import type z from "zod"
import { fromZodError } from "zod-validation-error"

import { getJWTPayload, type JWTPayload } from "./jwt"

type User = Omit<JWTPayload, "filter">

type Filter = JWTPayload["filter"]

const loader = {
	unauthed: <
		TInputSchemaOrCallback extends z.ZodTypeAny | (() => Promise<unknown>),
	>(
		inputSchemaOrCallback: TInputSchemaOrCallback,
	): TInputSchemaOrCallback extends z.ZodTypeAny
		? <TResponse>(
				callback: (
					input: z.infer<TInputSchemaOrCallback>,
				) => Promise<TResponse>,
		  ) => (input: z.infer<TInputSchemaOrCallback>) => Promise<TResponse>
		: TInputSchemaOrCallback extends () => Promise<unknown>
		  ? () => ReturnType<TInputSchemaOrCallback>
		  : never => {
		if (typeof inputSchemaOrCallback !== "function") {
			type TInput = typeof inputSchemaOrCallback extends z.ZodTypeAny
				? z.infer<typeof inputSchemaOrCallback>
				: never

			return (<TResponse>(
				callback: (input: TInput) => Promise<TResponse>,
			): ((input: TInput) => Promise<TResponse>) => {
				return async (input: TInput) => {
					const parsedInput = inputSchemaOrCallback.safeParse(input)

					if (!parsedInput.success) {
						const validatedError = fromZodError(parsedInput.error)

						throw validatedError
					}

					return await callback(input)
				}
			}) as TInputSchemaOrCallback extends z.ZodTypeAny
				? <TResponse>(
						callback: (
							input: z.infer<TInputSchemaOrCallback>,
						) => Promise<TResponse>,
				  ) => (
						input: z.infer<TInputSchemaOrCallback>,
				  ) => Promise<TResponse>
				: TInputSchemaOrCallback extends () => Promise<unknown>
				  ? () => ReturnType<TInputSchemaOrCallback>
				  : never
		} else {
			return (async () => {
				return await inputSchemaOrCallback()
			}) as TInputSchemaOrCallback extends z.ZodTypeAny
				? <TResponse>(
						callback: (
							input: z.infer<TInputSchemaOrCallback>,
						) => Promise<TResponse>,
				  ) => (
						input: z.infer<TInputSchemaOrCallback>,
				  ) => Promise<TResponse>
				: TInputSchemaOrCallback extends () => Promise<unknown>
				  ? () => ReturnType<TInputSchemaOrCallback>
				  : never
		}
	},
	authed: <
		TInputSchemaOrCallback extends
			| z.ZodTypeAny
			| (({
					user,
					filter,
			  }: {
					user: User
					filter: Filter
			  }) => Promise<unknown>),
	>(
		inputSchemaOrCallback: TInputSchemaOrCallback,
	): TInputSchemaOrCallback extends z.ZodTypeAny
		? <TResponse>(
				callback: (
					input: z.infer<TInputSchemaOrCallback>,
					{
						user,
						filter,
					}: {
						user: User
						filter: Filter
					},
				) => Promise<TResponse>,
		  ) => (input: z.infer<TInputSchemaOrCallback>) => Promise<TResponse>
		: TInputSchemaOrCallback extends ({
					user,
					filter,
		    }: {
					user: User
					filter: Filter
		    }) => Promise<unknown>
		  ? () => ReturnType<TInputSchemaOrCallback>
		  : never => {
		if (typeof inputSchemaOrCallback !== "function") {
			type TInput = typeof inputSchemaOrCallback extends z.ZodTypeAny
				? z.infer<typeof inputSchemaOrCallback>
				: never

			return (<TResponse>(
				callback: (
					input: TInput,
					{
						user,
						filter,
					}: {
						user: User
						filter: Filter
					},
				) => Promise<TResponse>,
			): ((input: TInput) => Promise<TResponse>) => {
				return async (input: TInput) => {
					const parsedInput = inputSchemaOrCallback.safeParse(input)

					if (!parsedInput.success) {
						const validatedError = fromZodError(parsedInput.error)

						throw validatedError
					}

					const jwtPayload = await getJWTPayload()

					if (jwtPayload === undefined) {
						redirect("/signin")
					}

					return await callback(input, {
						user: {
							username: jwtPayload.username,
							name: jwtPayload.name,
							role: jwtPayload.role,
						},
						filter: jwtPayload.filter,
					})
				}
			}) as TInputSchemaOrCallback extends z.ZodTypeAny
				? <TResponse>(
						callback: (
							input: z.infer<TInputSchemaOrCallback>,
							{
								user,
								filter,
							}: {
								user: User
								filter: Filter
							},
						) => Promise<TResponse>,
				  ) => (
						input: z.infer<TInputSchemaOrCallback>,
				  ) => Promise<TResponse>
				: TInputSchemaOrCallback extends ({
							user,
							filter,
				    }: {
							user: User
							filter: Filter
				    }) => Promise<unknown>
				  ? () => ReturnType<TInputSchemaOrCallback>
				  : never
		} else {
			return (async () => {
				const jwtPayload = await getJWTPayload()

				if (jwtPayload === undefined) {
					redirect("/signin")
				}

				return await inputSchemaOrCallback({
					user: {
						username: jwtPayload.username,
						name: jwtPayload.name,
						role: jwtPayload.role,
					},
					filter: jwtPayload.filter,
				})
			}) as TInputSchemaOrCallback extends z.ZodTypeAny
				? <TResponse>(
						callback: (
							input: z.infer<TInputSchemaOrCallback>,
							{
								user,
								filter,
							}: {
								user: User
								filter: Filter
							},
						) => Promise<TResponse>,
				  ) => (
						input: z.infer<TInputSchemaOrCallback>,
				  ) => Promise<TResponse>
				: TInputSchemaOrCallback extends ({
							user,
							filter,
				    }: {
							user: User
							filter: Filter
				    }) => Promise<unknown>
				  ? () => ReturnType<TInputSchemaOrCallback>
				  : never
		}
	},
}

export default loader
