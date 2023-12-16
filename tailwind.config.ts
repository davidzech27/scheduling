import { type Config } from "tailwindcss"

import theme from "./theme.cjs"

export default {
	content: ["./src/**/*.tsx"],
	theme: {
		extend: theme,
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config
