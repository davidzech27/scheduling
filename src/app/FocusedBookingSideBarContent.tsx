import { useState, useEffect, useRef } from "react"

import AutoComplete from "~/components/AutoComplete"
import Text from "~/components/Text"
import Button from "~/components/Button"
import Input from "~/components/Input"
import { useFocusedBooking } from "~/client/booking"
import { useCurrentUser, useSearchUsers } from "~/client/user"
import { useSettings } from "~/client/settings"
import { useSearchRooms } from "~/client/room"
import { useFilter } from "~/client/filter"
import TextArea from "~/components/TextArea"

function parseTime(timeString: string) {
	const [hourString, minuteString] = timeString
		.replaceAll(/[^0-9:]/g, "")
		.split(":")

	const hours =
		Number(hourString) +
		(timeString.includes("A")
			? Number(hourString) === 12
				? -12
				: 0
			: Number(hourString) === 12
			  ? 0
			  : 12)

	const minutes = Number(minuteString ?? "0")

	if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
		return undefined
	}

	return {
		hours,
		minutes,
	}
}

export default function FocusedBookingSideBarContent() {
	const [usernameInput, setUsernameInput] = useState("")

	const usernameInputRef = useRef<HTMLInputElement>(null)

	const suggestedUsers = useSearchUsers({ text: usernameInput })

	function onChangeUsernameInput(input: string) {
		setUsernameInput(input)

		const inputUser = suggestedUsers.find((user) => user.username === input)

		if (inputUser === undefined || focusedBooking === undefined) return

		focusedBooking.edit({
			username: input,
		})

		void focusedBooking.save()
	}

	const [roomNameInput, setRoomNameInput] = useState("")

	const roomNameInputRef = useRef<HTMLInputElement>(null)

	const suggestedRooms = useSearchRooms({ text: roomNameInput })

	function onChangeRoomNameInput(input: string) {
		setRoomNameInput(input)

		const inputRoom = suggestedRooms.find((user) => user.name === input)

		if (inputRoom === undefined || focusedBooking === undefined) return

		focusedBooking.edit({
			roomName: input,
		})

		void focusedBooking.save()
	}

	const [startAtInput, setStartAtInput] = useState("")
	const [endAtInput, setEndAtInput] = useState("")

	const startAtInputRef = useRef<HTMLInputElement>(null)
	const endAtInputRef = useRef<HTMLInputElement>(null)

	const changedTimeRef = useRef(false)

	function onChangeStartAtInput(input: string) {
		if (focusedBooking === undefined) return

		changedTimeRef.current = true

		setTimeout(() => {
			if (
				startAtInputRef.current !== null &&
				(startAtInputRef.current.selectionStart ?? 0) >=
					startAtInputRef.current.value.length - 2
			) {
				startAtInputRef.current.setSelectionRange(
					startAtInputRef.current.value.length - 2,
					startAtInputRef.current.value.length - 2,
				)
			}
		}, 0)

		const pOrM =
			input.toUpperCase().match(/(P|A)(?!M)/)?.[0] ??
			input.toUpperCase().match(/(P|A)/)?.[0]

		input = input
			.toUpperCase()
			.replaceAll(/[^0-9]/g, "")
			.slice(-4)

		if (input.length > 2) {
			input = input.slice(0, -2) + ":" + input.slice(-2)
		}

		if (input !== "") {
			input = input.concat(
				pOrM === "A"
					? "AM"
					: pOrM === "P"
					  ? "PM"
					  : focusedBooking.startAt.getHours() < 12
					    ? "AM"
					    : "PM",
			)
		}

		setStartAtInput(input)

		if (input === "") return

		const parsedTime = parseTime(input)

		if (parsedTime === undefined) return

		const newStartAt = new Date(focusedBooking.startAt)
		newStartAt.setHours(parsedTime.hours)
		newStartAt.setMinutes(parsedTime.minutes)

		const endOfDay = new Date(focusedBooking.startAt)
		endOfDay.setHours(23, 59)

		const newEndAt = new Date(focusedBooking.endAt)
		newEndAt.setTime(
			Math.min(
				newEndAt.getTime() +
					(newStartAt.getTime() - focusedBooking.startAt.getTime()),
				endOfDay.getTime(),
			),
		)

		focusedBooking.edit({
			startAt: newStartAt,
			endAt: newEndAt,
		})
	}

	function onChangeEndAtInput(input: string) {
		if (focusedBooking === undefined) return

		changedTimeRef.current = true

		setTimeout(() => {
			if (
				endAtInputRef.current !== null &&
				(endAtInputRef.current.selectionStart ?? 0) >=
					endAtInputRef.current.value.length - 2
			) {
				endAtInputRef.current.setSelectionRange(
					endAtInputRef.current.value.length - 2,
					endAtInputRef.current.value.length - 2,
				)
			}
		}, 0)

		const pOrM =
			input.toUpperCase().match(/(P|A)(?!M)/)?.[0] ??
			input.toUpperCase().match(/(P|A)/)?.[0]

		input = input
			.toUpperCase()
			.replaceAll(/[^0-9]/g, "")
			.slice(-4)

		if (input.length > 2) {
			input = input.slice(0, -2) + ":" + input.slice(-2)
		}

		if (input !== "") {
			input = input.concat(
				pOrM === "A"
					? "AM"
					: pOrM === "P"
					  ? "PM"
					  : focusedBooking.endAt.getHours() < 12
					    ? "AM"
					    : "PM",
			)
		}

		setEndAtInput(input)

		if (input === "") return

		const parsedTime = parseTime(input)

		if (parsedTime === undefined) return

		const newEndAt = new Date(focusedBooking.endAt)
		newEndAt.setHours(parsedTime.hours)
		newEndAt.setMinutes(parsedTime.minutes)

		focusedBooking.edit({
			endAt: newEndAt,
		})
	}

	const focusedBooking = useFocusedBooking()

	useEffect(() => {
		if (focusedBooking?.id !== undefined) {
			setUsernameInput(focusedBooking.username)
			setRoomNameInput(focusedBooking.roomName)
			setFlagInput(focusedBooking.flag)

			if (document.activeElement !== startAtInputRef.current) {
				setStartAtInput(
					`${
						focusedBooking.startAt.getHours() % 12 || 12
					}:${focusedBooking.startAt
						.getMinutes()
						.toString()
						.padStart(2, "0")}${
						focusedBooking.startAt.getHours() < 12 ? "AM" : "PM"
					}`,
				)
			}

			if (document.activeElement !== endAtInputRef.current) {
				setEndAtInput(
					`${
						focusedBooking.endAt.getHours() % 12 || 12
					}:${focusedBooking.endAt
						.getMinutes()
						.toString()
						.padStart(2, "0")}${
						focusedBooking.endAt.getHours() < 12 ? "AM" : "PM"
					}`,
				)
			}
		}
	}, [
		focusedBooking?.id,
		focusedBooking?.username,
		focusedBooking?.roomName,
		focusedBooking?.startAt,
		focusedBooking?.endAt,
		focusedBooking?.flag,
	])

	const [flagInput, setFlagInput] = useState<string | undefined>(undefined)

	const flagInputRef = useRef<HTMLTextAreaElement>(null)

	const currentUser = useCurrentUser()

	const filter = useFilter()

	const deleteFocusedBooking = focusedBooking?.delete

	useEffect(() => {
		if (currentUser.role === "provider" && filter.date < new Date()) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === "Backspace" &&
				(document.activeElement === document.body ||
					document.activeElement?.classList.contains("booking")) &&
				deleteFocusedBooking !== undefined
			) {
				void deleteFocusedBooking()
			}
		}

		document.addEventListener("keydown", handleKeyDown)

		return () => {
			document.removeEventListener("keydown", handleKeyDown)
		}
	}, [deleteFocusedBooking, filter, currentUser])

	const settings = useSettings()

	if (focusedBooking === undefined) return

	return (
		<div key={focusedBooking.id} className="flex h-full flex-col">
			<div
				style={{
					height: settings.navHeight + settings.headerHeight,
				}}
				className="flex flex-col justify-end p-3 pb-1.5"
			>
				<Text variant="title">Editing</Text>
			</div>

			<div className="flex flex-1 flex-col justify-between p-3 pt-1.5">
				<div className="space-y-2">
					<div className="space-y-1">
						<Text variant="label" htmlFor="username">
							User
						</Text>

						<AutoComplete
							results={suggestedUsers.map((user) => ({
								content: (
									<>
										<Text className="text-sm font-semibold text-title">
											{user.name}
										</Text>

										<div className="flex flex-wrap items-baseline justify-between gap-0.5">
											<Text className="text-xs font-normal text-subtext">
												{user.username}
											</Text>

											<Text className="text-[10px] font-semibold uppercase tracking-wide text-primary">
												{user.role}
											</Text>
										</div>
									</>
								),
								onSelect: () => {
									onChangeUsernameInput(user.username)

									setTimeout(() => {
										usernameInputRef.current?.select()
									}, 0)
								},
							}))}
							open={
								usernameInput !== focusedBooking.username &&
								suggestedUsers.length !== 0
							}
							className="w-[231px]"
						>
							<Input
								ref={usernameInputRef}
								size="small"
								id="username"
								required
								placeholder="username"
								text={usernameInput}
								onText={onChangeUsernameInput}
								onFocus={(e) => e.target.select()}
								spellCheck={false}
								autoComplete="off"
								className="w-full"
							/>
						</AutoComplete>
					</div>

					<div className="space-y-1">
						<Text variant="label" htmlFor="room-name">
							Room
						</Text>

						<AutoComplete
							results={suggestedRooms.map((room) => ({
								content: (
									<Text className="text-sm font-semibold text-title">
										{room.name}
									</Text>
								),
								onSelect: () => {
									onChangeRoomNameInput(room.name)

									setTimeout(() => {
										roomNameInputRef.current?.select()
									}, 0)
								},
							}))}
							open={
								roomNameInput !== focusedBooking.roomName &&
								suggestedRooms.length !== 0
							}
							className="w-[231px]"
						>
							<Input
								ref={roomNameInputRef}
								size="small"
								id="room-name"
								required
								placeholder="room"
								text={roomNameInput}
								onText={onChangeRoomNameInput}
								onFocus={(e) => e.target.select()}
								spellCheck={false}
								autoComplete="off"
								className="w-full"
							/>
						</AutoComplete>
					</div>

					<div className="flex space-x-1.5">
						<div className="w-1/2 space-y-1">
							<Text variant="label" htmlFor="start-at">
								Start
							</Text>

							<Input
								ref={startAtInputRef}
								size="small"
								id="start-at"
								required
								placeholder="start"
								text={startAtInput}
								onText={onChangeStartAtInput}
								onFocus={(e) => e.target.select()}
								onBlur={() => {
									setStartAtInput(
										`${
											focusedBooking.startAt.getHours() %
												12 || 12
										}:${focusedBooking.startAt
											.getMinutes()
											.toString()
											.padStart(2, "0")}${
											focusedBooking.startAt.getHours() <
											12
												? "AM"
												: "PM"
										}`,
									)

									if (changedTimeRef.current) {
										void focusedBooking.save()

										changedTimeRef.current = false
									}
								}}
								spellCheck={false}
								autoComplete="off"
								className="w-full"
							/>
						</div>

						<div className="w-1/2 space-y-1">
							<Text variant="label" htmlFor="end-at">
								End
							</Text>

							<Input
								ref={endAtInputRef}
								size="small"
								id="end-at"
								required
								placeholder="end"
								text={endAtInput}
								onText={onChangeEndAtInput}
								onFocus={(e) => e.target.select()}
								onBlur={() => {
									setEndAtInput(
										`${
											focusedBooking.endAt.getHours() %
												12 || 12
										}:${focusedBooking.endAt
											.getMinutes()
											.toString()
											.padStart(2, "0")}${
											focusedBooking.endAt.getHours() < 12
												? "AM"
												: "PM"
										}`,
									)

									if (changedTimeRef.current) {
										void focusedBooking.save()

										changedTimeRef.current = false
									}
								}}
								spellCheck={false}
								autoComplete="off"
								className="w-full"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<Text variant="label" htmlFor="flag">
							Flag
						</Text>

						{flagInput === undefined ? (
							<Button
								onClick={() => {
									setFlagInput("")

									setTimeout(() => {
										flagInputRef.current?.focus()
									}, 0)
								}}
								size="small"
								variant="light"
								className="w-full"
							>
								Set flag
							</Button>
						) : (
							<TextArea
								ref={flagInputRef}
								size="small"
								id="flag"
								placeholder="flag"
								text={flagInput}
								onText={setFlagInput}
								onFocus={(element) =>
									element.currentTarget.select()
								}
								onBlur={() => {
									if (flagInput.trim() === "") {
										setFlagInput(undefined)

										if (focusedBooking.flag !== undefined) {
											focusedBooking.edit({
												flag: null,
											})

											void focusedBooking.save()
										}
									} else if (
										flagInput.trim() !==
										focusedBooking.flag?.trim()
									) {
										focusedBooking.edit({
											flag: flagInput.trim(),
										})

										void focusedBooking.save()
									}
								}}
								onEnter={() => {
									if (
										document.activeElement instanceof
										HTMLElement
									) {
										document.activeElement.blur()
									}
								}}
								className="w-full"
							/>
						)}

						{focusedBooking.flag !== undefined && (
							<Button
								onClick={() => {
									setFlagInput(undefined)

									focusedBooking.edit({
										flag: null,
									})

									void focusedBooking.save()
								}}
								size="small"
								variant="light"
								id="resolve-flag"
								className="w-full"
							>
								Resolve flag
							</Button>
						)}
					</div>
				</div>

				{(currentUser.role !== "provider" ||
					filter.date >= new Date()) && (
					<Button
						onClick={focusedBooking.delete}
						size="medium"
						variant="light"
					>
						Delete
					</Button>
				)}
			</div>
		</div>
	)
}
