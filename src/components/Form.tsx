"use client"

import {
	useRef,
	useState,
	useEffect,
	useCallback,
	forwardRef,
	useImperativeHandle,
	createContext,
} from "react"

import { useShowToast } from "./Toast"
import deepEqual from "~/util/deepEqual"

interface Props extends React.PropsWithChildren {
	action?: (formData: FormData) => Promise<unknown>
	validationMessage:
		| string
		| ((fieldValidity: Record<string, ValidityState>) => string)
	className?: string
}

export const ValidationContext = createContext({
	valid: false,
	validationMessage: null as string | null,
})

const Form = forwardRef<HTMLFormElement, Props>(
	({ children, action, validationMessage, className }, forwardedRef) => {
		const [valid, setValid] = useState(false)

		const [fieldValidity, setFieldValidity] = useState<
			Record<string, ValidityState>
		>({})

		const ref = useRef<HTMLFormElement>(null)

		useImperativeHandle(forwardedRef, () => {
			if (ref.current === null) {
				throw new Error("Ref is null")
			}

			return ref.current
		})

		const updateValidation = useCallback((formElement: HTMLFormElement) => {
			setValid(formElement.checkValidity())

			const newFieldValidity = Object.fromEntries(
				[...formElement.querySelectorAll("input")].map((input) => [
					input.name,
					input.validity,
				]),
			)

			setFieldValidity((prevFieldValidity) =>
				deepEqual(prevFieldValidity, newFieldValidity)
					? prevFieldValidity
					: newFieldValidity,
			)
		}, [])

		useEffect(() => {
			if (ref.current === null) return

			updateValidation(ref.current)
		}, [updateValidation])

		const showToast = useShowToast()

		return (
			<form
				ref={ref}
				noValidate
				onInput={(e) => {
					updateValidation(e.currentTarget)
				}}
				action={async (formData) => {
					if (action === undefined) return

					const response = await action(formData)

					if (
						typeof response === "object" &&
						response !== null &&
						"message" in response &&
						typeof response.message === "string" &&
						"status" in response &&
						typeof response.status === "string" &&
						(response.status === "error" ||
							response.status === "success" ||
							response.status === "warning" ||
							response.status === "info")
					) {
						showToast({
							text: response.message,
							variant: response.status,
						})
					}
				}}
				className={className}
			>
				<ValidationContext.Provider
					value={{
						valid,
						validationMessage:
							typeof validationMessage === "string"
								? validationMessage
								: validationMessage(fieldValidity),
					}}
				>
					{children}
				</ValidationContext.Provider>
			</form>
		)
	},
)

Form.displayName = "Form"

export default Form
