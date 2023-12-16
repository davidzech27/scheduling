"use client"

import { ChevronDown } from "lucide-react"
import format from "date-fns/format"

import Calendar from "~/components/Calendar"
import Button from "~/components/Button"
import Popover from "~/components/Popover"

type Props = {
	date: Date
	size?: "small" | "medium" | "large"
	side?: "top" | "right" | "bottom" | "left"
	align?: "start" | "center" | "end"
} & (
	| { onChangeDate: (date: Date) => void }
	| { action: (date: Date) => Promise<void> }
) & {
		className?: string
	}

export default function DayPicker({
	date,
	size,
	side,
	align,
	className,
	...props
}: Props) {
	return (
		<Popover
			content={
				<Calendar
					selected={date}
					onDayClick={
						"onChangeDate" in props
							? (date) => {
									props.onChangeDate(date)
							  }
							: async (date) => {
									await props.action(date)
							  }
					}
				/>
			}
			side={side}
			align={align}
		>
			<Button
				size={size}
				variant="light"
				suffix={
					<ChevronDown className="relative bottom-[0.5px] left-[3px] h-6 w-6 text-title" />
				}
				className={className}
			>
				{format(date, "MM/dd/yyyy")}
			</Button>
		</Popover>
	)
}
