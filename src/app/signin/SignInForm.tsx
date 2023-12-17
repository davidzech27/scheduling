"use client"

import Form from "~/components/Form"
import Text from "~/components/Text"
import Input from "~/components/Input"
import SubmitButton from "~/components/SubmitButton"
import data from "~/data/data"

export default function SignInForm() {
	return (
		<Form
			action={async (formData) => {
				return await data.auth.signIn({
					username: formData.get("username")?.toString() ?? "",
					password: formData.get("password")?.toString() ?? "",
					timezoneOffset: new Date().getTimezoneOffset(),
				})
			}}
			validationMessage="You must enter a username and password."
			className="w-[600px] rounded-xl border border-border bg-white p-16 shadow-lg"
		>
			<Text variant="heading">Sign in</Text>

			<div className="pt-8" />

			<div className="space-y-4">
				<div className="flex flex-col space-y-1">
					<Text variant="label" htmlFor="username">
						Username
					</Text>

					<Input
						name="username"
						id="username"
						required
						placeholder="username"
						autoFocus
					/>
				</div>

				<div className="flex flex-col space-y-1">
					<Text variant="label" htmlFor="password">
						Password
					</Text>

					<Input
						type="password"
						name="password"
						id="password"
						required
						placeholder="password"
					/>
				</div>
			</div>

			<div className="pt-8" />

			<SubmitButton size="large" className="w-full">
				Sign in
			</SubmitButton>
		</Form>
	)
}
