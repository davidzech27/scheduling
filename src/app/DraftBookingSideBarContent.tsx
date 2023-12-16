import { useState, useRef, useEffect } from "react"

import Text from "~/components/Text"
import AutoComplete from "~/components/AutoComplete"
import { useCurrentUser, useSearchUsers } from "~/client/user"
import { useSearchRooms } from "~/client/room"
import { useDraftBooking } from "~/client/booking"
import { useSettings } from "~/client/settings"
import { useFilter } from "~/client/filter"
import Input from "~/components/Input"

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

export default function DraftBookingSideBarContent() {
	const filter = useFilter()

	const [usernameInput, setUsernameInput] = useState("")

	const usernameInputRef = useRef<HTMLInputElement>(null)

	const suggestedUsers = useSearchUsers({ text: usernameInput })

	function onChangeUsernameInput(input: string) {
		setUsernameInput(input)

		const inputUser = suggestedUsers.find((user) => user.username === input)

		if (inputUser === undefined) return

		draftBooking.edit({
			username: input,
		})

		void draftBooking.create()
	}

	const [roomNameInput, setRoomNameInput] = useState("")

	const roomNameInputRef = useRef<HTMLInputElement>(null)

	const suggestedRooms = useSearchRooms({ text: roomNameInput })

	function onChangeRoomNameInput(input: string) {
		setRoomNameInput(input)

		const inputRoom = suggestedRooms.find((user) => user.name === input)

		if (inputRoom === undefined) return

		draftBooking.edit({
			roomName: input,
		})

		void draftBooking.create()
	}

	const [startAtInput, setStartAtInput] = useState("")
	const [endAtInput, setEndAtInput] = useState("")

	const startAtInputRef = useRef<HTMLInputElement>(null)
	const endAtInputRef = useRef<HTMLInputElement>(null)

	function onChangeStartAtInput(input: string) {
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
					  : (draftBooking.startAt?.getHours() ?? 0) < 12
					    ? "AM"
					    : "PM",
			)
		}

		setStartAtInput(input)

		if (input === "") return

		const parsedTime = parseTime(input)

		if (parsedTime === undefined) return

		const newStartAt = new Date(filter.date)
		newStartAt.setHours(parsedTime.hours)
		newStartAt.setMinutes(parsedTime.minutes)

		let newEndAt: Date | undefined = undefined

		if (
			draftBooking.startAt !== undefined &&
			draftBooking.endAt !== undefined
		) {
			const endOfDay = new Date(filter.date)
			endOfDay.setHours(23, 59)

			newEndAt = new Date(draftBooking.endAt)
			newEndAt.setTime(
				Math.min(
					newEndAt.getTime() +
						(newStartAt.getTime() - draftBooking.startAt.getTime()),
					endOfDay.getTime(),
				),
			)
		}

		draftBooking.edit({
			startAt: newStartAt,
			endAt: newEndAt,
		})

		void draftBooking.create()
	}

	function onChangeEndAtInput(input: string) {
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
					  : (draftBooking.endAt?.getHours() ?? 0) < 12
					    ? "AM"
					    : "PM",
			)
		}

		setEndAtInput(input)

		if (input === "") return

		const parsedTime = parseTime(input)

		if (parsedTime === undefined) return

		const newEndAt = new Date(filter.date)
		newEndAt.setHours(parsedTime.hours)
		newEndAt.setMinutes(parsedTime.minutes)

		draftBooking.edit({
			endAt: newEndAt,
		})

		void draftBooking.create()
	}

	const draftBooking = useDraftBooking()

	useEffect(() => {
		if (draftBooking.username !== undefined) {
			setUsernameInput(draftBooking.username)
		}

		if (draftBooking.roomName !== undefined) {
			setRoomNameInput(draftBooking.roomName)
		}

		if (
			draftBooking.startAt !== undefined &&
			document.activeElement !== startAtInputRef.current
		) {
			setStartAtInput(
				`${
					draftBooking.startAt.getHours() % 12 || 12
				}:${draftBooking.startAt
					.getMinutes()
					.toString()
					.padStart(2, "0")}${
					draftBooking.startAt.getHours() < 12 ? "AM" : "PM"
				}`,
			)
		}

		if (
			draftBooking.endAt !== undefined &&
			document.activeElement !== endAtInputRef.current
		) {
			setEndAtInput(
				`${
					draftBooking.endAt.getHours() % 12 || 12
				}:${draftBooking.endAt
					.getMinutes()
					.toString()
					.padStart(2, "0")}${
					draftBooking.endAt.getHours() < 12 ? "AM" : "PM"
				}`,
			)
		}
	}, [
		draftBooking?.username,
		draftBooking?.roomName,
		draftBooking?.startAt,
		draftBooking?.endAt,
	])

	const currentUser = useCurrentUser()

	useEffect(() => {
		if (draftBooking.focused) {
			if (currentUser.role !== "provider") {
				usernameInputRef.current?.focus()
			} else {
				roomNameInputRef.current?.focus()
			}
		}
	}, [draftBooking.focused, currentUser.role])

	const discardDraftBooking = draftBooking?.discard

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.key === "Backspace" &&
				(document.activeElement === document.body ||
					document.activeElement?.classList.contains("booking")) &&
				discardDraftBooking !== undefined
			) {
				void discardDraftBooking()
			}
		}

		document.addEventListener("keydown", handleKeyDown)

		return () => {
			document.removeEventListener("keydown", handleKeyDown)
		}
	}, [discardDraftBooking])

	const settings = useSettings()

	return (
		<div>
			<div
				style={{
					height: settings.navHeight + settings.headerHeight,
				}}
				className="flex flex-col justify-end p-3 pb-1.5"
			>
				<Text variant="title">Creating</Text>
			</div>

			<div className="space-y-2 p-3 pt-1.5">
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

										<Text className="text-[10px] font-semibold tracking-wide text-primary">
											{user.role.toUpperCase()}
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
							usernameInput !== draftBooking.username &&
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
							roomNameInput !== draftBooking.roomName &&
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
								if (draftBooking.startAt !== undefined) {
									setStartAtInput(
										`${
											draftBooking.startAt.getHours() %
												12 || 12
										}:${draftBooking.startAt
											.getMinutes()
											.toString()
											.padStart(2, "0")}${
											draftBooking.startAt.getHours() < 12
												? "AM"
												: "PM"
										}`,
									)
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
								if (draftBooking.endAt !== undefined) {
									setEndAtInput(
										`${
											draftBooking.endAt.getHours() %
												12 || 12
										}:${draftBooking.endAt
											.getMinutes()
											.toString()
											.padStart(2, "0")}${
											draftBooking.endAt.getHours() < 12
												? "AM"
												: "PM"
										}`,
									)
								}
							}}
							spellCheck={false}
							autoComplete="off"
							className="w-full"
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
