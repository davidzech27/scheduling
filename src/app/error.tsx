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

		reset()
	}, [error, reset])

	return null
}
