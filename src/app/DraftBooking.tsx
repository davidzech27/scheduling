import { useLayoutEffect, useRef, useState } from "react"

import cn from "~/util/cn"
import Text from "~/components/Text"
import { useDraftBooking } from "~/client/booking"
import { useRooms } from "~/client/room"
import { useUser } from "~/client/user"
import { useSettings } from "~/client/settings"

export default function DraftBooking() {
	const draftBooking = useDraftBooking()

	const user = useUser({ username: draftBooking.username ?? "" })

	const rooms = useRooms()

	const roomIndex =
		draftBooking.roomName !== undefined
			? rooms.findIndex((room) => room.name === draftBooking.roomName)
			: 0

	useLayoutEffect(() => {
		if (draftBooking.focused) {
			ref.current?.scrollIntoView({
				block: "nearest",
				inline: "nearest",
			})
		}
	}, [
		draftBooking.focused,
		draftBooking.roomName,
		draftBooking.startAt,
		draftBooking.endAt,
	])

	const [dragging, setDragging] = useState(false)

	const [grabbing, setGrabbing] = useState(false)

	const past =
		draftBooking.endAt !== undefined && draftBooking.endAt < new Date()

	const settings = useSettings()

	const ref = useRef<HTMLDivElement>(null)

	if (
		draftBooking.startAt === undefined ||
		draftBooking.endAt === undefined ||
		!draftBooking.focused
	)
		return null

	return (
		<div
			ref={ref}
			onMouseDown={(e) => {
				if (
					draftBooking.startAt === undefined ||
					draftBooking.endAt === undefined
				)
					return

				const initialCursorHours =
					(e.pageY +
						document.getElementById(
							"booking-calendar-main-y-scroll-area",
						)!.scrollTop -
						settings.navHeight -
						settings.headerHeight) /
					settings.hourHeight
				const initialStartAt = draftBooking.startAt
				const initialEndAt = draftBooking.endAt

				const elementWidth = e.currentTarget.clientWidth

				const updateRange = (e: MouseEvent) => {
					if (
						draftBooking.startAt === undefined ||
						draftBooking.endAt === undefined
					)
						return

					setGrabbing(true)

					const cursorHoursOffset =
						(e.clientY +
							document.getElementById(
								"booking-calendar-main-y-scroll-area",
							)!.scrollTop -
							settings.navHeight -
							settings.headerHeight) /
							settings.hourHeight -
						initialCursorHours

					const newStartAt = new Date(draftBooking.startAt)
					const newEndAt = new Date(draftBooking.endAt)

					const clampedCursorHoursOffset = Math.max(
						-initialStartAt.getHours() -
							initialStartAt.getMinutes() / 60,
						Math.min(
							cursorHoursOffset,
							24 -
								initialEndAt.getHours() -
								initialEndAt.getMinutes() / 60,
						),
					)

					newStartAt.setHours(
						initialStartAt.getHours() +
							Math.sign(clampedCursorHoursOffset) *
								Math.floor(Math.abs(clampedCursorHoursOffset)),
						initialStartAt.getMinutes() +
							Math.round(
								((clampedCursorHoursOffset * 60) % 60) / 5,
							) *
								5,
						0,
					)
					newEndAt.setHours(
						initialEndAt.getHours() +
							Math.sign(clampedCursorHoursOffset) *
								Math.floor(Math.abs(clampedCursorHoursOffset)),
						initialEndAt.getMinutes() +
							Math.round(
								((clampedCursorHoursOffset * 60) % 60) / 5,
							) *
								5,
						0,
					)

					const newRoomName =
						rooms[
							Math.max(
								0,
								Math.min(
									Math.floor(
										(e.clientX +
											document.getElementById(
												"booking-calendar-x-scroll-area",
											)!.scrollLeft -
											settings.marginWidth) /
											elementWidth,
									),
									rooms.length - 1,
								),
							)
						]?.name ?? draftBooking.roomName

					draftBooking.edit({
						roomName: newRoomName,
						startAt: newStartAt,
						endAt: newEndAt,
					})
				}

				document.addEventListener("mousemove", updateRange)

				const stopUpdatingRange = () => {
					setGrabbing(false)

					document.removeEventListener("mousemove", updateRange)

					document.removeEventListener("mouseup", stopUpdatingRange)

					void draftBooking.create()
				}

				document.addEventListener("mouseup", stopUpdatingRange)
			}}
			style={{
				top:
					settings.hourHeight *
					(draftBooking.startAt.getHours() +
						draftBooking.startAt.getMinutes() / 60),
				left: `calc(${roomIndex} * (${100 / settings.roomsInView}vw - ${
					(settings.marginWidth + settings.sideBarWidth) /
					settings.roomsInView
				}px + ${1 / settings.roomsInView}px))`,
				height:
					settings.hourHeight *
					(draftBooking.endAt.getHours() +
						draftBooking.endAt.getMinutes() / 60 -
						(draftBooking.startAt.getHours() +
							draftBooking.startAt.getMinutes() / 60)),
				width: `calc(${100 / settings.roomsInView}vw - ${
					(settings.marginWidth + settings.sideBarWidth) /
					settings.roomsInView
				}px + ${1 / settings.roomsInView}px)`,
			}}
			tabIndex={0}
			className={cn(
				"group absolute left-0 right-0 z-10 flex cursor-grab overflow-x-hidden rounded-lg bg-primary bg-opacity-[0.15] outline-2 outline-offset-[-2px] outline-white ring-ring transition-colors focus:z-30 focus-visible:outline focus-visible:ring-2",
				dragging && "focus:cursor-default focus:bg-opacity-100",
				grabbing && "focus:cursor-grabbing focus:bg-opacity-100",
				past && "opacity-50",
			)}
		>
			<div className="-z-10 h-full w-1.5 bg-primary" />

			<div className="w-full overflow-y-auto">
				<div
					className={cn(
						"flex h-full flex-col justify-between p-1.5",
						Math.abs(
							draftBooking.endAt.valueOf() -
								draftBooking.startAt.valueOf(),
						) <=
							10 * 60 * 1000 && "py-0",
					)}
				>
					<div>
						<Text
							as="div"
							className={cn(
								"text-sm font-semibold text-text transition",
								(grabbing || dragging) && "text-white",
							)}
						>
							{user?.name ?? ""}
						</Text>

						<Text
							as="div"
							className={cn(
								"text-xs text-text transition",
								(grabbing || dragging) && "text-white",
							)}
						>
							{`${
								draftBooking.startAt.getHours() % 12 || 12
							}:${draftBooking.startAt
								.getMinutes()
								.toString()
								.padStart(2, "0")} ${
								draftBooking.startAt.getHours() < 12
									? "AM"
									: "PM"
							} - ${
								draftBooking.endAt.getHours() % 12 || 12
							}:${draftBooking.endAt
								.getMinutes()
								.toString()
								.padStart(2, "0")} ${
								draftBooking.endAt.getHours() < 12 ? "AM" : "PM"
							}`}
						</Text>
					</div>
				</div>
			</div>

			<div
				onMouseDown={(e) => {
					e.stopPropagation()

					if (
						draftBooking.startAt === undefined ||
						draftBooking.endAt === undefined
					)
						return

					const initialStartAt = draftBooking.startAt
					const initialEndAt = draftBooking.endAt

					const updateStart = (e: MouseEvent) => {
						if (
							draftBooking.startAt === undefined ||
							draftBooking.endAt === undefined
						)
							return

						setDragging(true)

						const hours = Math.min(
							Math.max(
								0,
								(e.clientY +
									document.getElementById(
										"booking-calendar-main-y-scroll-area",
									)!.scrollTop -
									settings.navHeight -
									settings.headerHeight) /
									settings.hourHeight,
							),
							24,
						)

						const newStartAt = new Date(initialStartAt)

						newStartAt.setHours(
							Math.floor(hours),
							Math.round(((hours * 60) % 60) / 5) * 5,
							0,
						)

						if (newStartAt <= initialEndAt) {
							draftBooking.edit({
								startAt: newStartAt,
								endAt: initialEndAt,
							})
						} else {
							draftBooking.edit({
								startAt: initialEndAt,
								endAt: newStartAt,
							})
						}
					}

					document.addEventListener("mousemove", updateStart)

					const stopUpdatingStart = () => {
						setDragging(false)

						document.removeEventListener("mousemove", updateStart)

						document.removeEventListener(
							"mouseup",
							stopUpdatingStart,
						)

						void draftBooking.create()
					}

					document.addEventListener("mouseup", stopUpdatingStart)
				}}
				className={cn(
					"absolute left-0 right-0 top-0 h-1.5",
					!dragging && "cursor-row-resize",
					Math.abs(
						draftBooking.endAt.valueOf() -
							draftBooking.startAt.valueOf(),
					) <=
						5 * 60 * 1000 && "h-1",
				)}
			/>

			<div
				onMouseDown={(e) => {
					e.stopPropagation()

					if (
						draftBooking.startAt === undefined ||
						draftBooking.endAt === undefined
					)
						return

					const initialStartAt = draftBooking.startAt
					const initialEndAt = draftBooking.endAt

					const updateEnd = (e: MouseEvent) => {
						if (
							draftBooking.startAt === undefined ||
							draftBooking.endAt === undefined
						)
							return

						setDragging(true)

						const hours = Math.min(
							Math.max(
								0,
								(e.clientY +
									document.getElementById(
										"booking-calendar-main-y-scroll-area",
									)!.scrollTop -
									settings.navHeight -
									settings.headerHeight) /
									settings.hourHeight,
							),
							24,
						)

						const newEndAt = new Date(initialEndAt)

						newEndAt.setHours(
							Math.floor(hours),
							Math.round(((hours * 60) % 60) / 5) * 5,
							0,
						)

						if (newEndAt >= initialStartAt) {
							void draftBooking.edit({
								startAt: initialStartAt,
								endAt: newEndAt,
							})
						} else {
							void draftBooking.edit({
								startAt: newEndAt,
								endAt: initialStartAt,
							})
						}
					}

					document.addEventListener("mousemove", updateEnd)

					const stopUpdatingEnd = () => {
						setDragging(false)

						document.removeEventListener("mousemove", updateEnd)

						document.removeEventListener("mouseup", stopUpdatingEnd)

						void draftBooking.create()
					}

					document.addEventListener("mouseup", stopUpdatingEnd)
				}}
				className={cn(
					"absolute bottom-0 left-0 right-0 h-1.5",
					!dragging && "cursor-row-resize",
					Math.abs(
						draftBooking.endAt.valueOf() -
							draftBooking.startAt.valueOf(),
					) <=
						5 * 60 * 1000 && "h-1",
				)}
			/>
		</div>
	)
}
