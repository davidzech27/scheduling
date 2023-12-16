"use client"

import { type FocusEventHandler } from "react"
import * as Popover from "@radix-ui/react-popover"

import cn from "~/util/cn"

interface Props extends React.PropsWithChildren {
	results: {
		content: React.ReactNode
		onSelect: () => void
	}[]
	open: boolean
	onFocus?: FocusEventHandler<HTMLDivElement>
	onBlur?: FocusEventHandler<HTMLDivElement>
	className?: string
}

export default function AutoComplete({
	children,
	results,
	open,
	onFocus,
	onBlur,
	className,
}: Props) {
	return (
		<Popover.Root open={open}>
			<Popover.Trigger tabIndex={-1} className="h-fit w-full">
				{children}
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					sideOffset={8}
					align="start"
					onOpenAutoFocus={(e) => e.preventDefault()}
					onCloseAutoFocus={(e) => e.preventDefault()}
					onFocus={onFocus}
					onBlur={onBlur}
					className={cn(
						"z-50 rounded-lg border border-border bg-white p-1 shadow-sm ease-out animate-in fade-in slide-in-from-bottom-[2px]",
						className,
					)}
				>
					{results.map((result, index) => (
						<div
							key={index}
							role="button"
							onClick={result.onSelect}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" ||
									event.key === " "
								) {
									result.onSelect()
								}
							}}
							tabIndex={0}
							className="cursor-pointer rounded-md px-2 py-1.5 transition hover:bg-uiHoverBackground focus:bg-uiHoverBackground focus:outline-none"
						>
							{result.content}
						</div>
					))}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	)
}
