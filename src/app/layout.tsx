import "~/app/globals.css"

import { ToastProvider } from "~/components/Toast"

export const metadata = {
	title: "Scheduling",
	description: "Audiology room scheduling platform",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
				<ToastProvider>{children}</ToastProvider>
			</body>
		</html>
	)
}
