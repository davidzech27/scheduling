"use client"

import {
	useImperativeHandle,
	forwardRef,
	useRef,
	useState,
	type FocusEventHandler,
} from "react"
import { Search, X } from "lucide-react"

import cn from "~/util/cn"

interface Props extends React.PropsWithChildren {
	type?:
		| "button"
		| "checkbox"
		| "color"
		| "date"
		| "datetime-local"
		| "email"
		| "file"
		| "hidden"
		| "image"
		| "month"
		| "number"
		| "password"
		| "radio"
		| "range"
		| "reset"
		| "search"
		| "submit"
		| "tel"
		| "text"
		| "time"
		| "url"
		| "week"
	size?: "small" | "medium" | "large"
	name?: string
	id?: string
	text?: string
	onText?: (text: string) => void
	onFocus?: FocusEventHandler<HTMLInputElement>
	onBlur?: FocusEventHandler<HTMLInputElement>
	required?: boolean
	placeholder?: string
	autoFocus?: boolean
	autoComplete?: string
	spellCheck?: boolean
	className?: string
}

const Input = forwardRef<HTMLInputElement, Props>(
	(
		{
			type = "text",
			size = "medium",
			name,
			id,
			text,
			onText,
			onFocus,
			onBlur,
			required,
			placeholder,
			autoFocus,
			autoComplete,
			spellCheck,
			className,
		},
		forwardedRef,
	) => {
		const ref = useRef<HTMLInputElement>(null)

		useImperativeHandle(forwardedRef, () => {
			if (ref.current === null) {
				throw new Error("Ref is null")
			}

			return ref.current
		})

		const [empty, setEmpty] = useState(true)

		const content = (
			<input
				ref={ref}
				type={type}
				name={name}
				id={id}
				value={text}
				onFocus={onFocus}
				onBlur={onBlur}
				required={required}
				placeholder={placeholder}
				autoFocus={autoFocus}
				autoComplete={autoComplete}
				spellCheck={spellCheck}
				onInput={(e) => {
					setEmpty(e.currentTarget.value === "")

					onText && onText(e.currentTarget.value)
				}}
				className={cn(
					{
						small: "px-2.5 py-1.5 text-sm",
						medium: "px-3 py-2 text-base",
						large: "px-5 py-2.5 text-lg",
					}[size],
					type === "search" &&
						{
							small: "pl-[34px]",
							medium: "pl-[40px]",
							large: "pl-[52px]",
						}[size],
					"rounded-lg border border-border bg-inputBackground font-normal text-inputText outline-none ring-ring placeholder:font-normal placeholder:text-inputPlaceholder focus:border-transparent focus:ring-2",
					className,
				)}
			/>
		)

		if (type === "search") {
			return (
				<div className="relative h-fit w-full">
					<Search
						aria-label="Search"
						className={cn(
							"absolute text-inputPlaceholder",
							{
								small: "left-2.5 top-[9px] h-4 w-4",
								medium: "left-[13px] top-[12px] h-[18px] w-[18px]",
								large: "left-[19px] top-[15px] h-5 w-5",
							}[size],
						)}
					/>

					{content}

					{!empty && (
						<X
							onClick={() => {
								if (ref.current !== null) {
									ref.current.value = ""
								}

								setEmpty(true)

								setTimeout(() => ref.current?.focus())
							}}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" ||
									event.key === " "
								) {
									if (ref.current !== null) {
										ref.current.value = ""
									}

									setEmpty(true)

									setTimeout(() => ref.current?.focus())
								}
							}}
							role="button"
							aria-label="Clear search"
							tabIndex={0}
							className={cn(
								"absolute cursor-pointer rounded-sm text-inputPlaceholder outline-none ring-ring transition hover:opacity-hover focus-visible:ring-2",
								{
									small: "right-3 top-[9px] h-4 w-4",
									medium: "right-4 top-[12px] h-[18px] w-[18px]",
									large: "right-5 top-[15px] h-5 w-5",
								}[size],
							)}
						/>
					)}
				</div>
			)
		}

		return content
	},
)

Input.displayName = "Input"

export default Input
