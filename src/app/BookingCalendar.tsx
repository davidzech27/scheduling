"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus } from "lucide-react"

import Text from "~/components/Text"
import Booking from "./Booking"
import DropdownMenu from "~/components/DropdownMenu"
import DraftBooking from "./DraftBooking"
import Tooltip from "~/components/Tooltip"
import { useSettings } from "~/client/settings"
import { useFilter } from "~/client/filter"
import { useFocusedRoom, useRooms } from "~/client/room"
import { useBookingIds, useDraftBooking } from "~/client/booking"
import { useUnfocus } from "~/client/focus"
import { useCurrentUser } from "~/client/user"
import cn from "~/util/cn"

export default function Bookings() {
	const rooms = useRooms()

	const bookingIds = useBookingIds()

	const unfocus = useUnfocus()

	const draftBooking = useDraftBooking()

	const currentUser = useCurrentUser()

	const filter = useFilter()

	const settings = useSettings()

	const router = useRouter()

	useEffect(() => {
		let intervalId: NodeJS.Timeout

		const timeoutId = setTimeout(
			() => {
				router.refresh()

				intervalId = setInterval(() => {
					router.refresh()
				}, 60 * 1000)
			},
			(60 - new Date().getSeconds()) * 1000,
		)

		return () => {
			clearTimeout(timeoutId)
			clearInterval(intervalId)
		}
	}, [router])

	const xScrollAreaRef = useRef<HTMLDivElement>(null)
	const sideYScrollAreaRef = useRef<HTMLDivElement>(null)
	const mainYScrollAreaRef = useRef<HTMLDivElement>(null)

	const scrolled = useRef(false)

	useEffect(() => {
		if (scrolled.current) return

		mainYScrollAreaRef.current?.scrollTo({
			top:
				new Date().getHours() * settings.hourHeight -
				mainYScrollAreaRef.current.clientHeight / 3,
			behavior: "smooth",
		})

		setTimeout(() => {
			scrolled.current = true
		}, 1000)
	}, [settings.hourHeight])

	const focusedRoom = useFocusedRoom()

	useEffect(() => {
		document.getElementById(`room-${focusedRoom?.name}`)?.scrollIntoView({
			block: "nearest",
			inline: "nearest",
		})
	}, [focusedRoom?.name])

	return (
		<div className="relative flex flex-1">
			<div
				style={{ width: settings.marginWidth }}
				className="flex flex-col"
			>
				<div
					style={{ height: settings.headerHeight }}
					className="flex flex-col items-center justify-end border-b border-border pb-1.5"
				>
					<div className="flex items-center space-x-1">
						<Minus
							onClick={() => {
								settings.decrementHourHeight()
							}}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" ||
									event.key === " "
								) {
									settings.decrementHourHeight()
								}
							}}
							role="button"
							aria-label="Decrease number of rooms in view"
							tabIndex={0}
							className="h-4 w-4 cursor-pointer rounded-sm text-text outline-none ring-ring transition hover:bg-uiBackground focus-visible:ring-2"
						/>

						<Tooltip
							text="Height of a calendar hour (pixels)"
							side="right"
							disableHoverableContent
						>
							<div className="rounded-sm outline-none ring-ring focus-visible:ring-2">
								<Text className="w-6 whitespace-nowrap text-center text-sm font-semibold text-text">
									{settings.hourHeight}
								</Text>
							</div>
						</Tooltip>

						<Plus
							onClick={() => {
								settings.incrementHourHeight()
							}}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" ||
									event.key === " "
								) {
									settings.incrementHourHeight()
								}
							}}
							role="button"
							aria-label="Increase number rooms in view"
							tabIndex={0}
							className="h-4 w-4 cursor-pointer rounded-sm text-text outline-none ring-ring transition hover:bg-uiBackground focus-visible:ring-2"
						/>
					</div>

					<div className="flex items-center space-x-1">
						<Minus
							onClick={() => {
								settings.decrementRoomsInView()
							}}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" ||
									event.key === " "
								) {
									settings.decrementRoomsInView()
								}
							}}
							role="button"
							aria-label="Decrease number of rooms in view"
							tabIndex={0}
							className="h-4 w-4 cursor-pointer rounded-sm text-text outline-none ring-ring transition hover:bg-uiBackground focus-visible:ring-2"
						/>

						<Tooltip
							text="Rooms in view"
							side="right"
							disableHoverableContent
						>
							<div className="rounded-sm outline-none ring-ring focus-visible:ring-2">
								<Text className="w-6 text-center text-sm font-semibold text-text">
									{settings.roomsInView}
								</Text>
							</div>
						</Tooltip>

						<Plus
							onClick={() => {
								settings.incrementRoomsInView()
							}}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" ||
									event.key === " "
								) {
									settings.incrementRoomsInView()
								}
							}}
							role="button"
							aria-label="Increase number rooms in view"
							tabIndex={0}
							className="h-4 w-4 cursor-pointer rounded-sm text-text outline-none ring-ring transition hover:bg-uiBackground focus-visible:ring-2"
						/>
					</div>
				</div>

				<div
					ref={sideYScrollAreaRef}
					onScroll={(e) => {
						if (scrolled.current) {
							mainYScrollAreaRef.current?.scrollTo({
								top: e.currentTarget.scrollTop,
							})
						}
					}}
					style={{
						height: `calc(100vh - ${settings.navHeight}px - ${settings.headerHeight}px)`,
					}}
					className="no-scroll-bar relative overflow-y-scroll"
				>
					{Array(24)
						.fill(0)
						.map((_, index) => (
							<div
								key={index}
								style={{
									height: settings.hourHeight,
								}}
								className="border-r border-border"
							>
								{index !== 0 &&
									Math.abs(
										new Date().getHours() * 60 +
											new Date().getMinutes() -
											index * 60,
									) >= 5 && (
										<div
											style={{
												bottom: settings.hourHeight / 2,
											}}
											className="relative flex h-full items-center justify-end p-1.5"
										>
											<Text
												as="span"
												className="text-xs tracking-[-0.05em] text-subtext"
											>
												{index % 12 || 12}:
												{index < 12 ? "00 AM" : "00 PM"}
											</Text>
										</div>
									)}
							</div>
						))}

					<div
						style={{
							top:
								settings.hourHeight *
									(new Date().getHours() +
										new Date().getMinutes() / 60) -
								13.5,
						}}
						className="absolute right-1.5 h-min"
					>
						<Text
							as="span"
							className="text-xs font-semibold tracking-[-0.05em] text-title"
						>
							{new Date().getHours() % 12 || 12}:
							{new Date()
								.getMinutes()
								.toString()
								.padStart(2, "0")}{" "}
							{new Date().getHours() < 12 ? "AM" : "PM"}
						</Text>
					</div>
				</div>
			</div>

			<div
				ref={xScrollAreaRef}
				id="booking-calendar-x-scroll-area"
				className="flex-1 overflow-x-scroll"
			>
				<div
					onWheel={(e) => {
						if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
							if (Math.abs(e.deltaX) <= 3) {
								xScrollAreaRef.current?.scrollTo({
									left:
										Math.round(
											xScrollAreaRef.current.scrollLeft /
												((window.innerWidth -
													settings.marginWidth -
													settings.sideBarWidth) /
													settings.roomsInView),
										) *
										((window.innerWidth -
											settings.marginWidth -
											settings.sideBarWidth) /
											settings.roomsInView),
									behavior: "smooth",
								})
							}
						}
					}}
					style={{ height: settings.headerHeight }}
					className="flex w-max"
				>
					{rooms.map((room) => (
						<div
							key={room.name}
							id={`room-${room.name}`}
							style={{
								width: `calc(${
									100 / settings.roomsInView
								}vw - ${
									(settings.marginWidth +
										settings.sideBarWidth) /
									settings.roomsInView
								}px + ${1 / settings.roomsInView}px)`,
							}}
							className="flex h-full flex-col justify-end border-b border-border"
						>
							<button
								onClick={room.focus}
								className={cn(
									"flex items-center justify-around rounded-md p-1.5 transition hover:bg-uiBackground",
									room.focused &&
										"bg-uiActiveBackground hover:bg-uiActiveBackground",
								)}
							>
								{room.tags.length === 0 ? (
									<div className="w-3.5" />
								) : (
									<DropdownMenu
										items={[
											{
												group: [
													{
														label: (
															<Text variant="title">
																Tags
															</Text>
														),
													},
													...room.tags.map(
														(tag, index) => ({
															item: (
																<Text>
																	{tag}
																</Text>
															),
															onSelect: () => {
																room.focus()

																setTimeout(
																	() => {
																		document
																			.getElementById(
																				`tag-${index}`,
																			)
																			?.focus()
																	},
																	0,
																)
															},
														}),
													),
												],
											},
											{
												item: <Text>Add tag</Text>,
												onSelect: () => {
													room.focus()

													setTimeout(() => {
														document
															.getElementById(
																`add-tag`,
															)
															?.click()
													}, 0)
												},
											},
										]}
										side="bottom"
									>
										<div className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-title">
											<span className="text-[10px] font-semibold text-white">
												{room.tags.length}
											</span>
										</div>
									</DropdownMenu>
								)}

								<Text variant="title" className="text-sm">
									{room.name}
								</Text>

								{room.flag === undefined ? (
									<div className="w-3.5" />
								) : (
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
																{room.flag}
															</Text>
														),
														onSelect: () => {
															room.focus()

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
												item: <Text>Resolve flag</Text>,
												onSelect: () => {
													room.focus()

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
										<div className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-error" />
									</DropdownMenu>
								)}
							</button>
						</div>
					))}
				</div>

				<div
					ref={mainYScrollAreaRef}
					id="booking-calendar-main-y-scroll-area"
					onWheel={(e) => {
						if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
							xScrollAreaRef.current?.scrollBy({
								left: e.deltaX,
							})

							if (Math.abs(e.deltaX) <= 3) {
								xScrollAreaRef.current?.scrollTo({
									left:
										Math.round(
											xScrollAreaRef.current.scrollLeft /
												((window.innerWidth -
													settings.marginWidth -
													settings.sideBarWidth) /
													settings.roomsInView),
										) *
										((window.innerWidth -
											settings.marginWidth -
											settings.sideBarWidth) /
											settings.roomsInView),
									behavior: "smooth",
								})
							}
						}
					}}
					onScroll={(e) => {
						sideYScrollAreaRef.current?.scrollTo({
							top: e.currentTarget.scrollTop,
						})
					}}
					style={{
						height: `calc(100vh - ${settings.navHeight}px - ${settings.headerHeight}px)`,
					}}
					className="no-scroll-bar relative flex w-max overflow-y-scroll"
				>
					{filter.date.getDate() === new Date().getDate() && (
						<div
							style={{
								top:
									settings.hourHeight *
										(new Date().getHours() +
											new Date().getMinutes() / 60) -
									0.5,
							}}
							className="absolute left-0 right-0 z-20 h-[1px] bg-black/30"
						/>
					)}

					{rooms.map((room) => (
						<div
							key={room.name}
							onDoubleClick={(e) => {
								if (
									filter.date.getDate() <
										new Date().getDate() &&
									currentUser.role === "provider"
								)
									return

								const elementWidth = e.currentTarget.clientWidth

								const roomName =
									rooms[
										Math.floor(
											(e.clientX +
												document.getElementById(
													"booking-calendar-x-scroll-area",
												)!.scrollLeft -
												settings.marginWidth) /
												elementWidth,
										)
									]?.name

								const minutes =
									Math.round(
										(60 *
											(e.clientY +
												document.getElementById(
													"booking-calendar-main-y-scroll-area",
												)!.scrollTop -
												settings.navHeight -
												settings.headerHeight)) /
											settings.hourHeight /
											5,
									) * 5

								const startAt = new Date(filter.date)
								startAt.setHours(0, minutes)

								const endAt = new Date(
									startAt.getTime() + 60 * 60 * 1000,
								)

								draftBooking.edit({
									roomName,
									startAt,
									endAt,
								})

								if (currentUser.role === "provider") {
									draftBooking.edit({
										username: currentUser.username,
									})
								}

								void draftBooking.create()
							}}
							onMouseDown={(e) => {
								if (
									filter.date.getDate() <
										new Date().getDate() &&
									currentUser.role === "provider"
								) {
									unfocus()

									return
								}

								const username =
									currentUser.role === "provider"
										? currentUser.username
										: undefined

								const elementWidth = e.currentTarget.clientWidth

								const roomName =
									rooms[
										Math.floor(
											(e.clientX +
												document.getElementById(
													"booking-calendar-x-scroll-area",
												)!.scrollLeft -
												settings.marginWidth) /
												elementWidth,
										)
									]?.name

								const initialStartAt = new Date(filter.date)

								initialStartAt.setHours(
									0,
									Math.round(
										(60 *
											(e.clientY +
												document.getElementById(
													"booking-calendar-main-y-scroll-area",
												)!.scrollTop -
												settings.navHeight -
												settings.headerHeight)) /
											settings.hourHeight /
											5,
									) * 5,
								)

								const initialClientY = e.clientY

								let yOffsetThreshold = false

								const updateEnd = (e: MouseEvent) => {
									if (
										Math.abs(e.clientY - initialClientY) >=
										settings.hourHeight * (5 / 60)
									) {
										yOffsetThreshold = true
									}

									if (!yOffsetThreshold) return

									const minutes =
										Math.round(
											(60 *
												Math.min(
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
												)) /
												5,
										) * 5

									const newEndAt = new Date(filter.date)
									newEndAt.setHours(0, minutes)

									if (newEndAt <= initialStartAt) {
										draftBooking.edit({
											roomName,
											startAt: newEndAt,
											endAt: initialStartAt,
											username,
										})
									} else {
										draftBooking.edit({
											roomName,
											startAt: initialStartAt,
											endAt: newEndAt,
											username,
										})
									}
								}

								document.addEventListener(
									"mousemove",
									updateEnd,
								)

								const stopUpdatingEnd = () => {
									document.removeEventListener(
										"mousemove",
										updateEnd,
									)

									document.removeEventListener(
										"mouseup",
										stopUpdatingEnd,
									)

									if (yOffsetThreshold) {
										void draftBooking.create()
									} else {
										unfocus()
									}
								}

								document.addEventListener(
									"mouseup",
									stopUpdatingEnd,
								)
							}}
							style={{
								width: `calc(${
									100 / settings.roomsInView
								}vw - ${
									(settings.marginWidth +
										settings.sideBarWidth) /
									settings.roomsInView
								}px + ${1 / settings.roomsInView}px)`,
							}}
							className="relative h-max border-r border-border last:border-r-0"
						>
							{Array(24)
								.fill(0)
								.map((_, index) => (
									<div
										key={index}
										style={{ height: settings.hourHeight }}
										className="-z-50 border-b border-lightBorder last:border-b-0"
									/>
								))}
						</div>
					))}

					{bookingIds.map((id) => (
						<Booking key={id} id={id} />
					))}

					<DraftBooking />
				</div>
			</div>
		</div>
	)
}
