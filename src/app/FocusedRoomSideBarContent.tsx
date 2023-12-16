import Text from "~/components/Text"
import Button from "~/components/Button"
import { useSettings } from "~/client/settings"
import { useFocusedRoom } from "~/client/room"
import { useFilter } from "~/client/filter"
import { useCurrentUser } from "~/client/user"
import { useDraftBooking } from "~/client/booking"

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

			<div className="flex flex-1 flex-col justify-between p-3 pt-1.5">
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
			</div>
		</div>
	)
}
