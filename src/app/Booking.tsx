import { useLayoutEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import { type Booking } from "~/data/booking"
import Text from "~/components/Text"
import { useSettings } from "../client/settings"
import cn from "~/util/cn"
import { useBooking } from "~/client/booking"
import { useUser } from "~/client/user"
import { useRooms } from "~/client/room"
import DropdownMenu from "~/components/DropdownMenu"

interface Props {
	id: number
}

export default function Booking({ id }: Props) {
	const booking = useBooking({ id })

	const user = useUser({ username: booking?.username ?? "" })

	const rooms = useRooms()

	const roomIndex = rooms.findIndex((room) => room.name === booking?.roomName)

	useLayoutEffect(() => {
		if (booking?.focused) {
			ref.current?.scrollIntoView({
				block: "nearest",
				inline: "nearest",
			})

			ref.current?.focus()
		} else {
			ref.current?.blur()
		}
	}, [booking?.focused])

	const startTime = booking?.startAt.getTime()
	const endTime = booking?.endAt.getTime()

	useLayoutEffect(() => {
		ref.current?.scrollIntoView({
			block: "nearest",
			inline: "nearest",
		})
	}, [startTime, endTime])

	const [dragging, setDragging] = useState(false)

	const [grabbing, setGrabbing] = useState(false)

	const past = (booking?.endAt ?? -1) < new Date()

	const settings = useSettings()

	const ref = useRef<HTMLDivElement>(null)

	if (booking === undefined) {
		console.error(`Booking with id ${id} not found`)

		return null
	}

	if (user === undefined) {
		console.error(`Booking with id ${id} not found`)

		return null
	}

	return (
		<div
			ref={ref}
			id={`booking-${id}`}
			onFocus={() => {
				if (
					document.activeElement?.getAttribute("data-side") !==
						null ||
					document.activeElement?.getAttribute("role") === "menuitem"
				)
					return

				booking.focus()
			}}
			onMouseDown={(e) => {
				const initialCursorHours =
					(e.pageY +
						document.getElementById(
							"booking-calendar-main-y-scroll-area",
						)!.scrollTop -
						settings.navHeight -
						settings.headerHeight) /
					settings.hourHeight
				const initialStartAt = booking.startAt
				const initialEndAt = booking.endAt
				const initialRoomName = booking.roomName

				let updatedStartAt = booking.startAt
				let updatedEndAt = booking.endAt
				let updatedRoomName = booking.roomName

				const elementWidth = e.currentTarget.clientWidth

				const updateRange = (e: MouseEvent) => {
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

					const newStartAt = new Date(booking.startAt)
					const newEndAt = new Date(booking.endAt)

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
						]?.name ?? booking.roomName

					booking.edit({
						roomName: newRoomName,
						startAt: newStartAt,
						endAt: newEndAt,
					})

					updatedStartAt = newStartAt
					updatedEndAt = newEndAt
					updatedRoomName = newRoomName
				}

				document.addEventListener("mousemove", updateRange)

				const stopUpdatingRange = () => {
					setGrabbing(false)

					document.removeEventListener("mousemove", updateRange)

					document.removeEventListener("mouseup", stopUpdatingRange)

					if (
						updatedStartAt.getTime() !== initialStartAt.getTime() ||
						updatedEndAt.getTime() !== initialEndAt.getTime() ||
						updatedRoomName !== initialRoomName
					) {
						void booking.save()
					}
				}

				document.addEventListener("mouseup", stopUpdatingRange)
			}}
			style={{
				top:
					settings.hourHeight *
					(booking.startAt.getHours() +
						booking.startAt.getMinutes() / 60),
				left: `calc(${roomIndex} * (${100 / settings.roomsInView}vw - ${
					(settings.marginWidth + settings.sideBarWidth) /
					settings.roomsInView
				}px + ${1 / settings.roomsInView}px))`,
				height:
					settings.hourHeight *
					(booking.endAt.getHours() +
						booking.endAt.getMinutes() / 60 -
						(booking.startAt.getHours() +
							booking.startAt.getMinutes() / 60)),
				width: `calc(${100 / settings.roomsInView}vw - ${
					(settings.marginWidth + settings.sideBarWidth) /
					settings.roomsInView
				}px + ${1 / settings.roomsInView}px)`,
			}}
			tabIndex={0}
			className={cn(
				"booking group absolute left-0 right-0 z-10 flex cursor-pointer overflow-x-hidden rounded-lg bg-primary bg-opacity-[0.15] outline-2 outline-offset-[-2px] outline-white ring-ring transition-colors focus:z-30 focus-visible:outline focus-visible:ring-2",
				booking.focused && "cursor-grab bg-opacity-50",
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
							booking.endAt.valueOf() - booking.startAt.valueOf(),
						) <=
							10 * 60 * 1000 && "py-0",
					)}
				>
					<div>
						<Text
							as="div"
							className={cn(
								"text-sm font-semibold text-text transition",
								booking.focused && "text-white",
							)}
						>
							{user.name}
						</Text>

						<Text
							as="div"
							className={cn(
								"text-xs text-text transition",
								booking.focused && "text-white",
							)}
						>
							{`${
								booking.startAt.getHours() % 12 || 12
							}:${booking.startAt
								.getMinutes()
								.toString()
								.padStart(2, "0")} ${
								booking.startAt.getHours() < 12 ? "AM" : "PM"
							} - ${
								booking.endAt.getHours() % 12 || 12
							}:${booking.endAt
								.getMinutes()
								.toString()
								.padStart(2, "0")} ${
								booking.endAt.getHours() < 12 ? "AM" : "PM"
							}`}
						</Text>
					</div>

					<div className="flex justify-end">
						{booking.flag !== undefined && (
							<DropdownMenu
								items={[
									{
										group: [
											{
												label: (
													<Text variant="title">
														Flag
													</Text>
												),
											},
											{
												item: (
													<Text className="max-w-[240px] whitespace-pre-wrap">
														{booking.flag}
													</Text>
												),
												onSelect: () => {
													booking.focus()

													setTimeout(() => {
														document
															.getElementById(
																`flag`,
															)
															?.focus()
													}, 0)
												},
											},
										],
									},
									{
										item: (
											<>
												<X className="h-4 w-4" />

												<Text>Resolve flag</Text>
											</>
										),
										onSelect: () => {
											booking.focus()

											setTimeout(() => {
												document
													.getElementById(
														`resolve-flag`,
													)
													?.click()
											}, 0)
										},
									},
								]}
								side="bottom"
							>
								<div className="flex h-3.5 w-3.5 animate-pulse items-center justify-center rounded-sm bg-primary outline-none ring-ring focus-visible:ring-2">
									<span className="text-[10px] font-semibold text-white">
										!
									</span>
								</div>
							</DropdownMenu>
						)}
					</div>
				</div>
			</div>

			<div
				onMouseDown={(e) => {
					e.stopPropagation()

					const initialStartAt = booking.startAt
					const initialEndAt = booking.endAt

					let updatedStartAt = booking.startAt
					let updatedEndAt = booking.endAt

					const updateStart = (e: MouseEvent) => {
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
							booking.edit({
								startAt: newStartAt,
								endAt: initialEndAt,
							})

							updatedStartAt = newStartAt
						} else {
							booking.edit({
								startAt: initialEndAt,
								endAt: newStartAt,
							})

							updatedEndAt = newStartAt
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

						if (
							updatedStartAt.getTime() !==
								initialStartAt.getTime() ||
							updatedEndAt.getTime() !== initialEndAt.getTime()
						) {
							void booking.save()
						}
					}

					document.addEventListener("mouseup", stopUpdatingStart)
				}}
				className={cn(
					"absolute left-0 right-0 top-0 h-1.5",
					!dragging && "cursor-row-resize",
					Math.abs(
						booking.endAt.valueOf() - booking.startAt.valueOf(),
					) <=
						5 * 60 * 1000 && "h-1",
				)}
			/>

			<div
				onMouseDown={(e) => {
					e.stopPropagation()

					const initialStartAt = booking.startAt
					const initialEndAt = booking.endAt

					let updatedStartAt = booking.startAt
					let updatedEndAt = booking.endAt

					const updateEnd = (e: MouseEvent) => {
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
							booking.edit({
								startAt: initialStartAt,
								endAt: newEndAt,
							})

							updatedEndAt = newEndAt
						} else {
							booking.edit({
								startAt: newEndAt,
								endAt: initialStartAt,
							})

							updatedStartAt = newEndAt
						}
					}

					document.addEventListener("mousemove", updateEnd)

					const stopUpdatingEnd = () => {
						setDragging(false)

						document.removeEventListener("mousemove", updateEnd)

						document.removeEventListener("mouseup", stopUpdatingEnd)

						if (
							updatedStartAt.getTime() !==
								initialStartAt.getTime() ||
							updatedEndAt.getTime() !== initialEndAt.getTime()
						) {
							void booking.save()
						}
					}

					document.addEventListener("mouseup", stopUpdatingEnd)
				}}
				className={cn(
					"absolute bottom-0 left-0 right-0 h-1.5",
					!dragging && "cursor-row-resize",
					Math.abs(
						booking.endAt.valueOf() - booking.startAt.valueOf(),
					) <=
						5 * 60 * 1000 && "h-1",
				)}
			/>
		</div>
	)
}
