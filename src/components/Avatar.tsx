import cn from "~/util/cn"

interface Props {
	initials: [string] | [string, string]
	className?: string
}

export default function Avatar({ initials, className }: Props) {
	return (
		<div
			className={cn(
				"flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white",
				className,
			)}
		>
			{initials}{" "}
		</div>
	)
}
