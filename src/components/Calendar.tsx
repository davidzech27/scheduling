"use client"

import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"

import cn from "~/util/cn"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export default function Calendar({ className, ...props }: CalendarProps) {
	return (
		<DayPicker
			initialFocus
			showOutsideDays
			className={cn("p-3", className)}
			classNames={{
				months: "flex space-x-4",
				month: "space-y-4",
				caption: "relative flex items-center justify-center pt-1",
				caption_label: "text-sm font-semibold text-title",
				nav: "flex items-center space-x-1",
				nav_button:
					"h-7 w-7 rounded-lg outline-offset-[-2px] outline-white ring-ring transition hover:bg-uiHoverBackground focus-visible:outline focus-visible:outline-2 focus-visible:ring-2",
				nav_button_previous: "absolute left-1",
				nav_button_next: "absolute right-1",
				table: "w-full border-collapse space-y-1",
				head_row: "flex",
				head_cell:
					"w-9 rounded-md text-[0.8rem] font-semibold text-text",
				row: "mt-2 flex w-full",
				cell: "relative h-9 w-9",
				day: "relative flex h-9 w-9 items-center justify-center rounded-lg text-center text-sm font-semibold text-title outline-offset-[-2px] outline-white ring-ring transition hover:bg-uiHoverBackground hover:opacity-hover focus-visible:outline focus-visible:outline-2 focus-visible:ring-2 aria-selected:z-20 aria-selected:bg-primary aria-selected:text-white",
				day_today: "bg-uiBackground",
				day_outside:
					"day-outside opacity-50 aria-selected:opacity-100 aria-selected:hover:opacity-hover",
				day_disabled: "opacity-disabled",
				day_hidden: "invisible",
			}}
			components={{
				IconLeft: () => (
					<ChevronLeft className="relative left-[1px] h-6 w-6 text-title" />
				),
				IconRight: () => (
					<ChevronRight className="relative left-[3px] h-6 w-6 text-title" />
				),
			}}
			{...props}
		/>
	)
}
