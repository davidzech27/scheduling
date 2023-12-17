import { unstable_noStore as noStore } from "next/cache"
import { cookies } from "next/headers"
import { ChevronDown, LogOut } from "lucide-react"

import data from "~/data/data"
import Button from "~/components/Button"
import Text from "~/components/Text"
import Avatar from "~/components/Avatar"
import DayPicker from "../components/DatePicker"
import BookingCalendar from "./BookingCalendar"
import DropdownMenu from "~/components/DropdownMenu"
import SideBar from "./SideBar"
import defaultSettings from "~/defaultSettings"
import { FilterProvider } from "../client/filter"
import { RoomProvider } from "~/client/room"
import { BookingProvider } from "~/client/booking"
import { UserProvider } from "~/client/user"
import { SettingsProvider } from "~/client/settings"

export default async function HomePage() {
	noStore()

	const user = await data.user.me()

	const filter = await data.filter.get()

	const [facilities, rooms, bookings, users] = await Promise.all([
		data.facility.all(),
		data.room.filter(filter),
		data.booking.filter(filter),
		data.user.filter(filter),
	])

	return (
		<FilterProvider filter={filter}>
			<RoomProvider rooms={rooms}>
				<BookingProvider bookings={bookings}>
					<UserProvider users={users} username={user.username}>
						<SettingsProvider
							hourHeight={
								cookies().has("hour_height")
									? Number(
											cookies().get("hour_height")?.value,
									  )
									: undefined
							}
							roomsInView={
								cookies().has("rooms_in_view")
									? Number(
											cookies().get("rooms_in_view")
												?.value,
									  )
									: undefined
							}
							maxRoomsInView={rooms.length}
						>
							<div className="flex h-screen">
								<main
									style={{
										width: `calc(100vw - ${defaultSettings.sideBarWidth}px)`,
									}}
									className="flex flex-col overflow-y-hidden"
								>
									<nav
										style={{
											height: defaultSettings.navHeight,
										}}
										className="flex items-center justify-between px-4 py-2"
									>
										<div className="flex space-x-2">
											<DropdownMenu
												items={facilities
													.filter(
														(facility) =>
															facility.name !==
															filter.facilityName,
													)
													.map((facility) => ({
														item: (
															<Text className="w-[166px]">
																{facility.name}
															</Text>
														),
														action: data.filter.update.bind(
															null,
															{
																facilityName:
																	facility.name,
															},
														),
													}))}
											>
												<Button
													size="medium"
													variant="light"
													suffix={
														<ChevronDown className="relative bottom-[0.5px] left-[3px] h-6 w-6 text-title" />
													}
													className="w-48"
												>
													{filter.facilityName}
												</Button>
											</DropdownMenu>

											<DayPicker
												date={filter.date}
												action={async (date) => {
													"use server"

													await data.filter.update({
														date,
													})
												}}
												align="end"
												className="w-36"
											/>
										</div>

										<DropdownMenu
											items={[
												{
													group: [
														{
															label: (
																<div className="w-60">
																	<Text className="text-base font-semibold text-primary">
																		{
																			user.name
																		}
																	</Text>

																	<Text className="text-xs font-normal text-subtext">
																		{
																			user.username
																		}
																	</Text>
																</div>
															),
														},
													],
												},
												{
													group: [
														{
															item: (
																<>
																	<LogOut className="h-4 w-4" />

																	<Text>
																		Log out
																	</Text>
																</>
															),
															action: async () => {
																"use server"

																await data.auth.logOut()
															},
														},
													],
												},
											]}
											align="end"
										>
											<button className="rounded-full outline-[2px] outline-offset-[-2px] outline-white ring-ring focus-visible:outline focus-visible:ring-2">
												<Avatar
													initials={[
														user.name[0] ?? "",
														user.name
															.split(" ")
															.at(-1)?.[0] ?? "",
													]}
												/>
											</button>
										</DropdownMenu>
									</nav>

									<BookingCalendar />
								</main>

								<SideBar />
							</div>
						</SettingsProvider>
					</UserProvider>
				</BookingProvider>
			</RoomProvider>
		</FilterProvider>
	)
}
