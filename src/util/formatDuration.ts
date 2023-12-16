export default function formatDuration(otherDate: Date) {
	const seconds =
		Math.abs(new Date().valueOf() - otherDate.valueOf()) / 1000 +
		(typeof window === "undefined" ? 0.75 : 0)

	if (seconds < 60) return `${Math.floor(seconds)}s`
	if (seconds / 60 < 60) return `${Math.floor(seconds / 60)}m`
	if (seconds / 60 ** 2 < 24)
		return `${Math.floor(seconds / 60 ** 2)}h ${Math.floor(
			(seconds % 60 ** 2) / 60,
		)}m`
	if (seconds / (24 * 60 ** 2) < 7)
		return `${Math.floor(seconds / (24 * 60 ** 2))}d`
	return `${Math.floor(seconds / (7 * 24 * 60 ** 2))}w`
}
