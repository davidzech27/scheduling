import { useEffect, useRef, useState } from "react"

import Input from "~/components/Input"
import Text from "~/components/Text"
import Button from "~/components/Button"
import { useSettings } from "~/client/settings"
import { useDraftBooking, useNextBooking } from "~/client/booking"
import { useRooms, useSearchRooms } from "~/client/room"
import { useFilter } from "~/client/filter"
import formatDuration from "~/util/formatDuration"
import { useCurrentUser, useSearchUsers, useUsers } from "~/client/user"
import { useFocusEntity } from "~/client/focus"

export default function DefaultSideBarContent() {
	const filter = useFilter()

	const draftBooking = useDraftBooking()

	const currentUser = useCurrentUser()

	const rooms = useRooms()

	const users = useUsers()

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
			startAt,
			endAt,
		})

		if (currentUser.role === "provider") {
			draftBooking.edit({
				username: currentUser.username,
			})
		}
	}

	const [searchInput, setSearchInput] = useState("")

	const searchInputRef = useRef<HTMLInputElement>(null)

	const searchedRooms = useSearchRooms({ text: searchInput })

	const searchedUsers = useSearchUsers({ text: searchInput })

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "/" && e.target === document.body) {
				setTimeout(() => searchInputRef.current?.focus(), 0)
			}
		}

		document.addEventListener("keydown", handleKeyDown)

		return () => {
			document.removeEventListener("keydown", handleKeyDown)
		}
	}, [])

	const focusEntity = useFocusEntity()

	const nextBooking = useNextBooking()

	const settings = useSettings()

	const roomListContent = (
		<div key="roomListContent" className="space-y-1">
			<Text variant="label" htmlFor="username">
				Rooms
			</Text>

			<div>
				<Text className="hidden pt-1 text-sm text-subtext last:block">
					No rooms found
				</Text>

				{(searchInput === ""
					? rooms.sort(
							(room1, room2) =>
								room1.minutesUsed - room2.minutesUsed,
					  )
					: searchedRooms
				)
					.filter(
						(room) => searchInput !== "" || room.minutesUsed > 0,
					)
					.map((room) => (
						<button
							key={room.name}
							onClick={() =>
								focusEntity({
									type: "room",
									name: room.name,
								})
							}
							className="flex w-full cursor-pointer flex-col rounded-lg px-3 py-2 transition hover:bg-uiBackground"
						>
							<Text
								as="span"
								className="text-sm font-semibold text-title"
							>
								{room.name}
							</Text>

							<Text as="span" className="text-xs text-subtext">
								Used for {room.minutesUsed} minutes
							</Text>
						</button>
					))}
			</div>
		</div>
	)

	const userListContent = (
		<div key="userListContent" className="space-y-1">
			<Text variant="label" htmlFor="username">
				Users
			</Text>

			<div>
				<Text className="hidden pt-1 text-sm text-subtext last:block">
					No users found
				</Text>

				{(searchInput === "" ? users : searchedUsers)
					.filter(
						(user) => searchInput !== "" || user.minutesSpent > 0,
					)
					.map((user) => (
						<button
							key={user.username}
							onClick={() =>
								focusEntity({
									type: "user",
									username: user.username,
								})
							}
							className="flex w-full cursor-pointer flex-col rounded-lg px-3 py-2 transition hover:bg-uiBackground"
						>
							<Text
								as="span"
								className="text-sm font-semibold text-title"
							>
								{user.username}
							</Text>

							<Text as="span" className="text-xs text-subtext">
								Spent {user.minutesSpent} minutes at{" "}
								{filter.facilityName}
							</Text>
						</button>
					))}
			</div>
		</div>
	)

	return (
		<div className="flex h-full flex-col">
			<div
				style={{
					height: settings.navHeight + settings.headerHeight,
				}}
				className="flex flex-col justify-between p-3 pb-1.5"
			>
				<Input
					ref={searchInputRef}
					text={searchInput}
					onText={setSearchInput}
					type="search"
					size="small"
					placeholder="Search"
					className="w-full"
				/>

				{searchInput === "" &&
					filter.date.getDate() === new Date().getDate() &&
					(nextBooking === undefined ? (
						<Text
							as="div"
							className="text-sm font-semibold text-subtext"
						>
							No upcoming bookings
						</Text>
					) : nextBooking.startAt > new Date() ? (
						<Text
							as="div"
							className="text-sm font-semibold text-primary"
						>
							{nextBooking.roomName} in{" "}
							{formatDuration(nextBooking.startAt)}
						</Text>
					) : (
						<Text
							as="div"
							className="text-sm font-semibold text-primary"
						>
							Ends in {formatDuration(nextBooking.endAt)}
						</Text>
					))}
			</div>

			<div className="space-y-3 p-3 pt-1.5">
				{searchInput === "" &&
					(filter.date.getDate() >= new Date().getDate() ||
						currentUser.role !== "provider") && (
						<Button
							onClick={createDraft}
							size="medium"
							className="w-full"
						>
							Create booking
						</Button>
					)}

				<div
					style={{
						height: `calc(100vh - ${
							settings.navHeight + settings.headerHeight
						} - 18 - ${
							filter.date.getDate() >= new Date().getDate() ||
							currentUser.role !== "provider"
								? 40 + 12
								: 0
						})`,
					}}
					className="space-y-2 overflow-y-auto"
				>
					{
						{
							provider: [roomListContent, userListContent],
							staff: [userListContent, roomListContent],
							admin: [userListContent, roomListContent],
						}[currentUser.role]
					}
				</div>
			</div>
		</div>
	)
}
