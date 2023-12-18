"use client"

import {
	useImperativeHandle,
	forwardRef,
	useRef,
	type FocusEventHandler,
} from "react"
import ExpandingTextArea from "react-expanding-textarea"

import cn from "~/util/cn"

interface Props extends React.PropsWithChildren {
	size?: "small" | "medium" | "large"
	name?: string
	id?: string
	text?: string
	onText?: (text: string) => void
	onFocus?: FocusEventHandler<HTMLTextAreaElement>
	onBlur?: FocusEventHandler<HTMLTextAreaElement>
	onEnter?: () => void
	required?: boolean
	placeholder?: string
	autoFocus?: boolean
	autoComplete?: string
	spellCheck?: boolean
	className?: string
}

const TextArea = forwardRef<HTMLTextAreaElement, Props>(
	(
		{
			size = "medium",
			name,
			id,
			text,
			onText,
			onFocus,
			onBlur,
			onEnter,
			required,
			placeholder,
			autoFocus,
			autoComplete,
			spellCheck,
			className,
		},
		forwardedRef,
	) => {
		const ref = useRef<HTMLTextAreaElement>(null)

		useImperativeHandle(forwardedRef, () => {
			if (ref.current === null) {
				throw new Error("Ref is null")
			}

			return ref.current
		})

		return (
			<ExpandingTextArea
				ref={ref}
				name={name}
				id={id}
				value={text}
				onFocus={onFocus}
				onBlur={onBlur}
				onKeyDown={(e) => {
					if (
						onEnter !== undefined &&
						e.key === "Enter" &&
						!e.shiftKey
					) {
						e.preventDefault()

						onEnter()
					}
				}}
				required={required}
				placeholder={placeholder}
				autoFocus={autoFocus}
				autoComplete={autoComplete}
				spellCheck={spellCheck}
				onInput={(e) => {
					onText && onText(e.currentTarget.value)
				}}
				style={{
					marginBottom: "-8px",
				}}
				className={cn(
					{
						small: "px-2.5 py-1.5 text-sm",
						medium: "px-3 py-2 text-base",
						large: "px-5 py-2.5 text-lg",
					}[size],
					"resize-none rounded-lg border border-border bg-inputBackground font-normal text-inputText outline-none ring-ring placeholder:font-normal placeholder:text-inputPlaceholder focus:border-transparent focus:ring-2",
					className,
				)}
			/>
		)
	},
)

TextArea.displayName = "TextArea"

export default TextArea
