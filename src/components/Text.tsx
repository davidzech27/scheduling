import { forwardRef } from "react"

import cn from "~/util/cn"

interface Props extends React.PropsWithChildren {
	as?:
		| "div"
		| "h1"
		| "h2"
		| "h3"
		| "h4"
		| "h5"
		| "h6"
		| "p"
		| "small"
		| "span"
		| "strong"
		| "label"
	variant?: "heading" | "label" | "title" | "prose"
	htmlFor?: string
	dangerouslySetInnerHTML?: { __html: string }
	className?: string
}

const Text = forwardRef<HTMLElement, Props>(
	(
		{ children, as, variant, htmlFor, dangerouslySetInnerHTML, className },
		ref,
	) => {
		const Component =
			as ??
			(variant === undefined
				? ("p" as const)
				: {
						heading: "h1" as const,
						label: "label" as const,
						title: "span" as const,
						prose: "p" as const,
				  }[variant])

		const selectable = ["h1", "h2", "h3", "h4", "h5", "h6", "p"].includes(
			Component,
		)

		return (
			<Component
				// @ts-expect-error - not sure there's a good way around this
				ref={ref}
				htmlFor={htmlFor}
				dangerouslySetInnerHTML={dangerouslySetInnerHTML}
				className={cn(
					variant &&
						{
							heading:
								"text-6xl font-semibold tracking-tight text-title",
							label: "text-sm font-semibold text-title",
							title: "text-base font-semibold text-title",
							prose: "text-base font-normal text-text",
						}[variant],
					!selectable && "select-none",
					className,
				)}
			>
				{children}
			</Component>
		)
	},
)

Text.displayName = "Text"

export default Text
