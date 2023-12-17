"use client"

import { useEffect } from "react"

export default function Error({
	error,
	reset,
}: {
	error: Error
	reset: () => void
}) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<div className="flex h-screen items-center justify-center bg-black">
			<div className="space-y-8">
				<div className="text-5xl font-semibold text-white">Error!</div>

				<div
					onClick={reset}
					role="button"
					className="text-5xl font-semibold text-white transition hover:opacity-hover"
				>
					Press to reset.
				</div>
			</div>
		</div>
	)
}
