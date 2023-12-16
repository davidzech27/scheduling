"use client"

import defaultSettings from "~/defaultSettings"
import FocusedBookingSideBarContent from "./FocusedBookingSideBarContent"
import DefaultSideBarContent from "./DefaultSideBarContent"
import DraftBookingSideBarContent from "./DraftBookingSideBarContent"
import FocusedRoomSideBarContent from "./FocusedRoomSideBarContent"
import FocusedUserSideBarContent from "./FocusedUserSideBarContent"
import { useFocusedEntity } from "~/client/focus"

export default function SideBar() {
	const focusedEntity = useFocusedEntity()

	return (
		<div
			style={{ width: defaultSettings.sideBarWidth }}
			className="h-full border-l border-border bg-white"
		>
			{focusedEntity?.type === "booking" ? (
				<FocusedBookingSideBarContent />
			) : focusedEntity?.type === "draft" ? (
				<DraftBookingSideBarContent />
			) : focusedEntity?.type === "room" ? (
				<FocusedRoomSideBarContent />
			) : focusedEntity?.type === "user" ? (
				<FocusedUserSideBarContent />
			) : (
				<DefaultSideBarContent />
			)}
		</div>
	)
}
