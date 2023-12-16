import * as auth from "./auth"
import * as user from "./user"
import * as facility from "./facility"
import * as room from "./room"
import * as booking from "./booking"
import * as filter from "./filter"

const data = {
	auth,
	user,
	facility,
	room,
	booking: {
		filter: booking.filter,
		create: booking.create,
		update: booking.update,
		delete: booking._delete,
	},
	filter,
}

export default data
