"use client"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Slot } from "@radix-ui/react-slot"

import cn from "~/util/cn"
import Text from "~/components/Text"

type Props = React.PropsWithChildren & {
	text: string
	side?: "top" | "right" | "bottom" | "left"
	align?: "start" | "center" | "end"
	disabled?: boolean
	disableHoverableContent?: boolean
	className?: string
}

export default function Tooltip({
	children,
	text,
	side,
	align,
	disabled = false,
	disableHoverableContent,
	className,
}: Props) {
	return (
		<TooltipPrimitive.Provider>
			<TooltipPrimitive.Root
				open={disabled ? false : undefined}
				delayDuration={0}
				disableHoverableContent={disableHoverableContent}
			>
				<TooltipPrimitive.Trigger asChild>
					<Slot tabIndex={disabled ? -1 : 0}>{children}</Slot>
				</TooltipPrimitive.Trigger>

				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content
						side={side}
						align={align}
						sideOffset={8}
						className={cn(
							"z-40 rounded-lg border border-border bg-white px-3 py-2 shadow-sm ease-out animate-in fade-in data-[side=bottom]:slide-in-from-bottom-[2px] data-[side=left]:slide-in-from-left-[2px] data-[side=right]:slide-in-from-right-[2px] data-[side=top]:slide-in-from-top-[2px]",
							className,
						)}
					>
						{
							<Text
								variant="prose"
								className="whitespace-pre-wrap"
							>
								{text}
							</Text>
						}

						<TooltipPrimitive.Arrow asChild>
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
						</TooltipPrimitive.Arrow>
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	)
}
