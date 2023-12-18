import { useEffect, useRef, useState } from "react"

import Text from "~/components/Text"
import Button from "~/components/Button"
import Input from "~/components/Input"
import TextArea from "~/components/TextArea"
import { useSettings } from "~/client/settings"
import { useFocusedRoom, useRoomTags } from "~/client/room"
import { useFilter } from "~/client/filter"
import { useCurrentUser } from "~/client/user"
import { useDraftBooking } from "~/client/booking"
import AutoComplete from "~/components/AutoComplete"

export default function FocusedRoomSideBarContent() {
	const focusedRoom = useFocusedRoom()

	const filter = useFilter()

	const currentUser = useCurrentUser()

	const settings = useSettings()

	const draftBooking = useDraftBooking()

	function createDraft() {
		const startAt = filter.date

		startAt.setHours(new Date().getHours())
		startAt.setMinutes(new Date().getMinutes())

		const endOfDay = new Date(filter.date)
		endOfDay.setHours(23, 59)

		const endAt = new Date(
			Math.min(startAt.getTime() + 60 * 60 * 1000, endOfDay.getTime()),
		)

		draftBooking.edit({
			roomName: focusedRoom?.name,
			startAt,
			endAt,
		})

		if (currentUser.role === "provider") {
			draftBooking.edit({
				username: currentUser.username,
			})
		}
	}

	useEffect(() => {
		if (focusedRoom?.name !== undefined) {
			setTagInputs(focusedRoom.tags)

			setFlagInput(focusedRoom.flag)
		}
	}, [focusedRoom?.name, focusedRoom?.tags, focusedRoom?.flag])

	const [flagInput, setFlagInput] = useState<string | undefined>(undefined)

	const flagInputRef = useRef<HTMLTextAreaElement>(null)

	const [tagInputs, setTagInputs] = useState<string[]>([])

	const [newTagInput, setNewTagInput] = useState<string | undefined>(
		undefined,
	)

	const newTagInputRef = useRef<HTMLInputElement>(null)

	const roomTags = useRoomTags().filter(
		(roomTag) => !focusedRoom?.tags.includes(roomTag),
	)

	const autocompleted = useRef(false)

	if (focusedRoom === undefined) return null

	return (
		<div key={focusedRoom.name} className="flex h-full flex-col">
			<div
				style={{
					height: settings.navHeight + settings.headerHeight,
				}}
				className="flex flex-col justify-end p-3 pb-1.5"
			>
				<div className="flex items-baseline justify-between">
					<Text variant="title">{focusedRoom.name}</Text>

					<Text className="text-sm text-subtext">
						Used for {focusedRoom.minutesUsed} minutes
					</Text>
				</div>
			</div>

			<div className="flex flex-1 flex-col space-y-2 p-3 pt-1.5">
				{(filter.date.getDate() >= new Date().getDate() ||
					currentUser.role !== "provider") && (
					<Button
						onClick={createDraft}
						size="medium"
						className="w-full"
					>
						Create booking in room
					</Button>
				)}

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

									if (focusedRoom.flag !== undefined) {
										focusedRoom.edit({
											flag: null,
										})

										void focusedRoom.save()
									}
								} else if (
									flagInput.trim() !==
									focusedRoom.flag?.trim()
								) {
									focusedRoom.edit({
										flag: flagInput.trim(),
									})

									void focusedRoom.save()
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

					{focusedRoom.flag !== undefined && (
						<Button
							onClick={() => {
								setFlagInput(undefined)

								focusedRoom.edit({
									flag: null,
								})

								void focusedRoom.save()
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

				<div className="space-y-1">
					<Text
						variant="label"
						htmlFor={
							newTagInput === undefined
								? `tag-${focusedRoom.tags.length - 1}`
								: "new-tag"
						}
					>
						Tags
					</Text>

					<div className="space-y-1">
						{tagInputs.map((tag, index) => (
							<AutoComplete
								key={index}
								results={roomTags.map((roomTag) => ({
									content: (
										<Text className="text-sm font-semibold text-title">
											{roomTag}
										</Text>
									),
									onSelect: () => {
										setTagInputs((tagInputs) => [
											...tagInputs.slice(0, index),
											roomTag,
											...tagInputs.slice(index + 1),
										])

										document
											.getElementById(`tag-${index}`)
											?.focus()
									},
								}))}
								open={
									tag !== "" &&
									tag !== focusedRoom.tags[index] &&
									roomTags.length !== 0 &&
									!roomTags.includes(tag)
								}
								onFocus={() => {
									autocompleted.current = true
								}}
								className="w-[231px]"
							>
								<Input
									size="small"
									id={`tag-${index}`}
									placeholder="tag"
									text={tag}
									onText={(text) =>
										setTagInputs((tagInputs) => [
											...tagInputs.slice(0, index),
											text,
											...tagInputs.slice(index + 1),
										])
									}
									onFocus={(element) =>
										element.currentTarget.select()
									}
									onBlur={() => {
										setTimeout(() => {
											if (autocompleted.current) {
												autocompleted.current = false

												return
											}

											setTagInputs((tagInputs) =>
												tagInputs
													.map((tagInput) =>
														tagInput.trim(),
													)
													.filter(Boolean),
											)

											if (
												tagInputs.some(
													(tagInput, index) =>
														tagInput.trim() !==
														focusedRoom.tags[index],
												)
											) {
												focusedRoom.edit({
													tags: tagInputs
														.map((tagInput) =>
															tagInput.trim(),
														)
														.filter(Boolean),
												})

												void focusedRoom.save()
											}
										}, 0)
									}}
									onEnter={() => {
										if (
											document.activeElement instanceof
											HTMLElement
										) {
											document.activeElement.blur()
										}
									}}
									autoComplete="off"
									className="w-full"
								/>
							</AutoComplete>
						))}

						{newTagInput === undefined ? (
							<Button
								onClick={() => {
									setNewTagInput("")

									setTimeout(() => {
										newTagInputRef.current?.focus()
									}, 0)
								}}
								size="small"
								variant="light"
								id="add-tag"
								className="w-full"
							>
								Add tag
							</Button>
						) : (
							<AutoComplete
								results={roomTags.map((roomTag) => ({
									content: (
										<Text className="text-sm font-semibold text-title">
											{roomTag}
										</Text>
									),
									onSelect: () => {
										setNewTagInput(roomTag)

										document
											.getElementById(`new-tag`)
											?.focus()
									},
								}))}
								open={
									newTagInput !== "" &&
									roomTags.length !== 0 &&
									!roomTags.includes(newTagInput)
								}
								onFocus={() => {
									autocompleted.current = true
								}}
								className="w-[231px]"
							>
								<Input
									ref={newTagInputRef}
									size="small"
									id="new-tag"
									placeholder="tag"
									text={newTagInput}
									onText={setNewTagInput}
									onBlur={() => {
										setTimeout(() => {
											if (autocompleted.current) {
												autocompleted.current = false

												return
											}

											setNewTagInput(undefined)

											if (newTagInput.trim() !== "") {
												setTagInputs((tagInputs) => [
													...tagInputs,
													newTagInput.trim(),
												])

												focusedRoom.edit({
													tags: [
														...focusedRoom.tags,
														newTagInput.trim(),
													],
												})

												void focusedRoom.save()
											}
										}, 100)
									}}
									onEnter={() => {
										if (
											document.activeElement instanceof
											HTMLElement
										) {
											document.activeElement.blur()
										}
									}}
									autoComplete="off"
									className="w-full"
								/>
							</AutoComplete>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
