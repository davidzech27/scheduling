import Text from "~/components/Text"
import Button from "~/components/Button"
import { useSettings } from "~/client/settings"
import { useFilter } from "~/client/filter"
import { useCurrentUser, useFocusedUser } from "~/client/user"
import { useDraftBooking } from "~/client/booking"

export default function FocusedUserSideBarContent() {
	const focusedUser = useFocusedUser()

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
			username: focusedUser?.username,
			startAt,
			endAt,
		})
	}

	if (focusedUser === undefined) return null

	return (
		<div key={focusedUser.username} className="flex h-full flex-col">
			<div
				style={{
					height: settings.navHeight + settings.headerHeight,
				}}
				className="flex flex-col justify-end p-3 pb-1.5"
			>
				<div className="flex flex-col space-y-1">
					<div className="flex items-baseline justify-between">
						<Text variant="title">{focusedUser.name}</Text>

						<Text className="text-sm font-semibold uppercase tracking-wide text-primary">
							{focusedUser.role}
						</Text>
					</div>

					<Text className="text-base text-text">
						{focusedUser.username}
					</Text>

					<Text className="text-sm text-subtext">
						Spent {focusedUser.minutesSpent} minutes at{" "}
						{filter.facilityName}
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
						Create booking for user
					</Button>
				)}
			</div>
		</div>
	)
}
