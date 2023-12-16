"use client"

import { forwardRef } from "react"

import cn from "~/util/cn"

interface Props extends React.PropsWithChildren {
	onClick?: () => void
	formAction?: (formData: FormData) => void
	size?: "small" | "medium" | "large"
	variant?: "primary" | "light" | "dark" | "text"
	suffix?: React.ReactNode
	type?: "button" | "submit" | "reset"
	disabled?: boolean
	loading?: boolean
	className?: string
}

const Button = forwardRef<HTMLButtonElement, Props>(
	(
		{
			children,
			onClick,
			formAction,
			size = "medium",
			variant = "primary",
			suffix,
			type,
			disabled,
			loading,
			className,
		},
		ref,
	) => {
		return (
			<button
				ref={ref}
				onClick={onClick}
				formAction={formAction}
				type={type}
				disabled={disabled === true || loading === true}
				className={cn(
					"relative flex items-center rounded-lg outline-offset-[-2px] outline-white ring-ring transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:ring-2",
					{
						small: "px-2.5 py-1.5",
						medium: "px-3.5 py-2",
						large: "px-6 py-3",
					}[size],
					{
						primary: "bg-primary",
						light: "bg-uiBackground",
						dark: "bg-title",
						text: "bg-white",
					}[variant],
					disabled
						? "opacity-disabled"
						: loading
						  ? "justify-center"
						  : {
									primary: "hover:opacity-hover",
									light: "hover:bg-uiHoverBackground",
									dark: "hover:opacity-hover",
									text: "hover:bg-uiHoverBackground",
						    }[variant],
					className,
				)}
			>
				{loading && (
					<div role="status" className="absolute m-auto">
						<svg
							aria-hidden="true"
							viewBox="0 0 100 101"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className={cn(
								"animate-spin duration-700",
								{
									small: "h-4 w-4",
									medium: "h-5 w-5",
									large: "h-6 w-6",
								}[size],
								{
									primary: "fill-white",
									light: "fill-title",
									dark: "fill-white",
									text: "fill-title",
								}[variant],
							)}
						>
							<path
								d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
								fill="currentFill"
							/>
						</svg>
					</div>
				)}

				<div className="flex flex-1 items-center justify-center">
					<span
						className={cn(
							"select-none font-semibold",
							{
								small: "text-sm",
								medium: "text-base",
								large: "text-lg",
							}[size],
							{
								primary: "text-white",
								light: "text-title",
								dark: "text-white",
								text: "text-title",
							}[variant],
							loading && "opacity-0",
						)}
					>
						{children}
					</span>
				</div>

				{suffix}
			</button>
		)
	},
)

Button.displayName = "Button"

export default Button
