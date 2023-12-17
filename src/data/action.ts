import { redirect } from "next/navigation"
import type z from "zod"
import { fromZodError } from "zod-validation-error"

import { getJWTPayload, setJWTPayload, type JWTPayload } from "./jwt"

type User = Omit<JWTPayload, "filter" | "timezoneOffset">

type Filter = JWTPayload["filter"]

const action = {
	unauthed: <
		TInputSchemaOrCallback extends
			| z.ZodTypeAny
			| (({
					setJWTPayload,
			  }: {
					setJWTPayload: (jwtPayload: JWTPayload) => Promise<void>
			  }) => Promise<unknown>),
	>(
		inputSchemaOrCallback: TInputSchemaOrCallback,
	): TInputSchemaOrCallback extends z.ZodTypeAny
		? <TResponse>(
				callback: (
					input: z.infer<TInputSchemaOrCallback>,
					{
						setJWTPayload,
					}: {
						setJWTPayload: (jwtPayload: JWTPayload) => Promise<void>
					},
				) => Promise<TResponse>,
		  ) => (input: z.infer<TInputSchemaOrCallback>) => Promise<TResponse>
		: TInputSchemaOrCallback extends ({
					setJWTPayload,
		    }: {
					setJWTPayload: (jwtPayload: JWTPayload) => Promise<void>
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
						setJWTPayload,
					}: {
						setJWTPayload: (jwtPayload: JWTPayload) => Promise<void>
					},
				) => Promise<TResponse>,
			): ((input: TInput) => Promise<TResponse>) => {
				return async (input: TInput) => {
					const parsedInput = inputSchemaOrCallback.safeParse(input)

					if (!parsedInput.success) {
						const validatedError = fromZodError(parsedInput.error)

						throw validatedError
					}

					return await callback(input, {
						setJWTPayload,
					})
				}
			}) as TInputSchemaOrCallback extends z.ZodTypeAny
				? <TResponse>(
						callback: (
							input: z.infer<TInputSchemaOrCallback>,
							{
								setJWTPayload,
							}: {
								setJWTPayload: (
									jwtPayload: JWTPayload,
								) => Promise<void>
							},
						) => Promise<TResponse>,
				  ) => (
						input: z.infer<TInputSchemaOrCallback>,
				  ) => Promise<TResponse>
				: TInputSchemaOrCallback extends ({
							setJWTPayload,
				    }: {
							setJWTPayload: (
								jwtPayload: JWTPayload,
							) => Promise<void>
				    }) => Promise<unknown>
				  ? () => ReturnType<TInputSchemaOrCallback>
				  : never
		} else {
			return (async () => {
				return await inputSchemaOrCallback({
					setJWTPayload,
				})
			}) as TInputSchemaOrCallback extends z.ZodTypeAny
				? <TResponse>(
						callback: (
							input: z.infer<TInputSchemaOrCallback>,
							{
								setJWTPayload,
							}: {
								setJWTPayload: (
									jwtPayload: JWTPayload,
								) => Promise<void>
							},
						) => Promise<TResponse>,
				  ) => (
						input: z.infer<TInputSchemaOrCallback>,
				  ) => Promise<TResponse>
				: TInputSchemaOrCallback extends ({
							setJWTPayload,
				    }: {
							setJWTPayload: (
								jwtPayload: JWTPayload,
							) => Promise<void>
				    }) => Promise<unknown>
				  ? () => ReturnType<TInputSchemaOrCallback>
				  : never
		}
	},
	authed: <
		TInputSchemaOrCallback extends
			| z.ZodTypeAny
			| (({
					user,
					setUser,
					filter,
					setFilter,
					timezoneOffset,
					deleteJWTPayload,
			  }: {
					user: User
					setUser: (user: User) => Promise<void>
					filter: Filter
					setFilter: (filter: Filter) => Promise<void>
					timezoneOffset: number
					deleteJWTPayload: () => Promise<void>
			  }) => Promise<unknown>),
	>(
		inputSchemaOrCallback: TInputSchemaOrCallback,
	): TInputSchemaOrCallback extends z.ZodTypeAny
		? <TResponse>(
				callback: (
					input: z.infer<TInputSchemaOrCallback>,
					{
						user,
						setUser,
						filter,
						setFilter,
						timezoneOffset,
						deleteJWTPayload,
					}: {
						user: User
						setUser: (user: User) => Promise<void>
						filter: Filter
						setFilter: (filter: Filter) => Promise<void>
						timezoneOffset: number
						deleteJWTPayload: () => Promise<void>
					},
				) => Promise<TResponse>,
		  ) => (input: z.infer<TInputSchemaOrCallback>) => Promise<TResponse>
		: TInputSchemaOrCallback extends ({
					user,
					setUser,
					filter,
					setFilter,
					timezoneOffset,
					deleteJWTPayload,
		    }: {
					user: User
					setUser: (user: User) => Promise<void>
					filter: Filter
					setFilter: (filter: Filter) => Promise<void>
					timezoneOffset: number
					deleteJWTPayload: () => Promise<void>
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
						setUser,
						filter,
						setFilter,
						timezoneOffset,
						deleteJWTPayload,
					}: {
						user: User
						setUser: (user: User) => Promise<void>
						filter: Filter
						setFilter: (filter: Filter) => Promise<void>
						timezoneOffset: number
						deleteJWTPayload: () => Promise<void>
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
						setUser: async (user: User) =>
							await setJWTPayload({ ...jwtPayload, ...user }),
						filter: jwtPayload.filter,
						setFilter: async (filter: Filter) =>
							await setJWTPayload({ ...jwtPayload, filter }),
						timezoneOffset: jwtPayload.timezoneOffset,
						deleteJWTPayload: async () =>
							await setJWTPayload(undefined),
					})
				}
			}) as TInputSchemaOrCallback extends z.ZodTypeAny
				? <TResponse>(
						callback: (
							input: z.infer<TInputSchemaOrCallback>,
							{
								user,
								setUser,
								filter,
								setFilter,
								timezoneOffset,
								deleteJWTPayload,
							}: {
								user: User
								setUser: (user: User) => Promise<void>
								filter: Filter
								setFilter: (filter: Filter) => Promise<void>
								timezoneOffset: number
								deleteJWTPayload: () => Promise<void>
							},
						) => Promise<TResponse>,
				  ) => (
						input: z.infer<TInputSchemaOrCallback>,
				  ) => Promise<TResponse>
				: TInputSchemaOrCallback extends ({
							user,
							setUser,
							filter,
							setFilter,
							timezoneOffset,
							deleteJWTPayload,
				    }: {
							user: User
							setUser: (user: User) => Promise<void>
							filter: Filter
							setFilter: (filter: Filter) => Promise<void>
							timezoneOffset: number
							deleteJWTPayload: () => Promise<void>
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
					setUser: async (user: User) =>
						await setJWTPayload({ ...jwtPayload, ...user }),
					filter: jwtPayload.filter,
					setFilter: async (filter: Filter) =>
						await setJWTPayload({ ...jwtPayload, filter }),
					timezoneOffset: jwtPayload.timezoneOffset,
					deleteJWTPayload: async () =>
						await setJWTPayload(undefined),
				})
			}) as TInputSchemaOrCallback extends z.ZodTypeAny
				? <TResponse>(
						callback: (
							input: z.infer<TInputSchemaOrCallback>,
							{
								user,
								setUser,
								filter,
								setFilter,
								timezoneOffset,
								deleteJWTPayload,
							}: {
								user: User
								setUser: (user: User) => Promise<void>
								filter: Filter
								setFilter: (filter: Filter) => Promise<void>
								timezoneOffset: number
								deleteJWTPayload: () => Promise<void>
							},
						) => Promise<TResponse>,
				  ) => (
						input: z.infer<TInputSchemaOrCallback>,
				  ) => Promise<TResponse>
				: TInputSchemaOrCallback extends ({
							user,
							setUser,
							filter,
							setFilter,
							timezoneOffset,
							deleteJWTPayload,
				    }: {
							user: User
							setUser: (user: User) => Promise<void>
							filter: Filter
							setFilter: (filter: Filter) => Promise<void>
							timezoneOffset: number
							deleteJWTPayload: () => Promise<void>
				    }) => Promise<unknown>
				  ? () => ReturnType<TInputSchemaOrCallback>
				  : never
		}
	},
}

export default action
