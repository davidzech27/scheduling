import {
	sqliteTable,
	text,
	primaryKey,
	uniqueIndex,
	integer,
} from "drizzle-orm/sqlite-core"

export const user = sqliteTable(
	"user",
	{
		username: text("username").primaryKey(),
		password: text("password").notNull(),
		name: text("name").notNull(),
		role: text("role", { enum: ["provider", "staff", "admin"] }).notNull(),
	},
	(table) => ({
		idx: uniqueIndex("username_password_unique_idx").on(
			table.username,
			table.password,
		),
	}),
)

export const facility = sqliteTable("facility", {
	name: text("name").primaryKey(),
})

export const room = sqliteTable(
	"room",
	{
		facilityName: text("facility_name").notNull(),
		roomName: text("room_name").notNull(),
	},
	(table) => ({
		cpk: primaryKey(table.facilityName, table.roomName),
	}),
)

export const booking = sqliteTable(
	"booking",
	{
		id: integer("id").primaryKey(),
		facilityName: text("facility_name").notNull(),
		roomName: text("room_name").notNull(),
		startAt: integer("start_at", { mode: "timestamp" }).notNull(),
		endAt: integer("end_at", { mode: "timestamp" }).notNull(),
		username: text("username").notNull(),
	},
	(table) => ({
		idx: uniqueIndex("facility_name_room_name_start_at_unique_idx").on(
			table.facilityName,
			table.roomName,
			table.startAt,
		),
	}),
)

// tag system
// requesting room assistance or time slot assistance
// flags and tags for rooms and bookings. flags are resolved, but tags are permanent
// roles: management, front desk, provider
// providers will have more responsibility
// lock previous days' history
// use local storage to save where they were last
// log all alterations for management
