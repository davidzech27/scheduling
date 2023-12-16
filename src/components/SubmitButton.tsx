"use client"

import { useContext, forwardRef } from "react"
import { useFormStatus } from "react-dom"

import Tooltip from "./Tooltip"
import Button from "./Button"
import { ValidationContext } from "./Form"

interface Props extends React.PropsWithChildren {
	formAction?: (formData: FormData) => void
	size?: "small" | "medium" | "large"
	variant?: "primary" | "light" | "dark" | "text"
	suffix?: React.ReactNode
	className?: string
}

const SubmitButton = forwardRef<HTMLButtonElement, Props>(
	(
		{
			children,
			formAction,
			size = "medium",
			variant = "primary",
			suffix,
			className,
		},
		ref,
	) => {
		const { valid: formValid, validationMessage: formValidationMessage } =
			useContext(ValidationContext)

		const formStatus = useFormStatus()

		const loading =
			(formAction === undefined || formAction === formStatus.action) &&
			formStatus.pending

		return (
			<Tooltip text={formValidationMessage ?? ""} disabled={formValid}>
				<div className="rounded-lg outline-none ring-ring focus-visible:ring-2">
					<Button
						ref={ref}
						formAction={formAction}
						size={size}
						variant={variant}
						suffix={suffix}
						disabled={!formValid}
						loading={loading}
						className={className}
					>
						{children}
					</Button>
				</div>
			</Tooltip>
		)
	},
)

SubmitButton.displayName = "SubmitButton"

export default SubmitButton
