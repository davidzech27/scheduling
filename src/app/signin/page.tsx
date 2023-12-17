import Text from "~/components/Text"
import Form from "~/components/Form"
import SubmitButton from "~/components/SubmitButton"
import Input from "~/components/Input"
import data from "~/data/data"

export default function SignInPage() {
	return (
		<main className="flex h-screen items-center justify-center bg-subtleBackground">
			<Form
				action={async (formData) => {
					"use server"

					return await data.auth.signIn({
						username: formData.get("username")?.toString() ?? "",
						password: formData.get("password")?.toString() ?? "",
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
		</main>
	)
}
