"use client"

import { useRef, useState, useEffect } from "react"
import { flushSync } from "react-dom"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Slot } from "@radix-ui/react-slot"

import cn from "~/util/cn"

interface Props extends React.PropsWithChildren {
	content: React.ReactNode
	side?: "top" | "right" | "bottom" | "left"
	align?: "start" | "center" | "end"
	disabled?: boolean
	className?: string
}

export default function Popover({
	children,
	content,
	side,
	align,
	disabled = false,
	className,
}: Props) {
	const [open, setOpen] = useState(false)

	const hovered = useRef(false)

	const hoverOpened = useRef(true)

	const prevFocusedElement = useRef<{ value: HTMLElement | null }>({
		value: null,
	})

	const triggerRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const checkHovered = (e: MouseEvent) => {
			const triggerRect = triggerRef.current?.getBoundingClientRect()
			const tooltipRect =
				contentRef.current?.getBoundingClientRect() ?? triggerRect

			if (triggerRect === undefined || tooltipRect === undefined) return

			const prevHovered = hovered.current

			hovered.current =
				(e.clientY <= triggerRect.bottom &&
					e.clientY >= triggerRect.top &&
					e.clientX <= triggerRect.right &&
					e.clientX >= triggerRect.left) ||
				(e.clientY <= tooltipRect.bottom &&
					e.clientY >= tooltipRect.top &&
					e.clientX <= tooltipRect.right &&
					e.clientX >= tooltipRect.left) ||
				(e.clientY <= Math.max(triggerRect.top, tooltipRect.top) &&
					e.clientY >=
						Math.min(triggerRect.bottom, tooltipRect.bottom) &&
					e.clientX <=
						Math.max(triggerRect.right, tooltipRect.right) &&
					e.clientX >=
						Math.min(triggerRect.left, tooltipRect.left)) ||
				(e.clientY <=
					Math.max(triggerRect.bottom, tooltipRect.bottom) &&
					e.clientY >= Math.min(triggerRect.top, tooltipRect.top) &&
					e.clientX <= Math.max(triggerRect.left, tooltipRect.left) &&
					e.clientX >= Math.min(triggerRect.right, tooltipRect.right))

			if (!prevHovered && hovered.current) {
				setOpen((open) => {
					if (!open) {
						hoverOpened.current = true

						if (document.activeElement instanceof HTMLElement) {
							prevFocusedElement.current.value =
								document.activeElement
						}

						return true
					}

					return open
				})
			}

			if (prevHovered && !hovered.current) {
				const prevHoverOpened = hoverOpened.current

				flushSync(() => {
					setOpen((open) => {
						if (hoverOpened.current) {
							hoverOpened.current = false

							return false
						}

						return open
					})
				})

				setTimeout(() => {
					if (prevHoverOpened) {
						if (document.activeElement instanceof HTMLElement) {
							document.activeElement.blur()
						}

						if (prevFocusedElement.current.value !== null) {
							prevFocusedElement.current.value.focus()
						}

						prevFocusedElement.current.value = null
					}
				}, 0)
			}
		}

		document.addEventListener("mousemove", checkHovered)

		return () => {
			document.removeEventListener("mousemove", checkHovered)
		}
	}, [])

	return (
		<PopoverPrimitive.Root
			open={disabled ? false : open}
			onOpenChange={(open) => {
				if (!open && hoverOpened.current) {
					hoverOpened.current = false
				} else {
					setOpen(open)
				}
			}}
		>
			<PopoverPrimitive.Trigger asChild>
				<Slot ref={triggerRef} tabIndex={disabled ? -1 : 0}>
					{children}
				</Slot>
			</PopoverPrimitive.Trigger>

			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					ref={contentRef}
					onClick={() => {
						hoverOpened.current = false
					}}
					side={side}
					align={align}
					sideOffset={8}
					onCloseAutoFocus={(e) => e.preventDefault()}
					className={cn(
						"z-50 rounded-lg border border-border bg-white p-2 shadow-sm ease-out animate-in fade-in data-[side=bottom]:slide-in-from-bottom-[2px] data-[side=left]:slide-in-from-left-[2px] data-[side=right]:slide-in-from-right-[2px] data-[side=top]:slide-in-from-top-[2px]",
						className,
					)}
				>
					{content}

					<PopoverPrimitive.Arrow asChild>
						<svg
							width="10"
							height="5"
							viewBox="0 0 30 10"
							preserveAspectRatio="none"
							className="translate-y-[-1px] fill-white"
						>
							<polygon points="0,0 30,0 15,10"></polygon>

							<line
								x1="0"
								y1="0"
								x2="15"
								y2="10"
								style={{
									strokeWidth: 2.5,
								}}
								className="stroke-border"
							/>

							<line
								x1="15"
								y1="10"
								x2="30"
								y2="0"
								style={{
									strokeWidth: 2.5,
								}}
								className="stroke-border"
							/>
						</svg>
					</PopoverPrimitive.Arrow>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	)
}
