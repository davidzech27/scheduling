"use client"

import { forwardRef } from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { create } from "zustand"

import cn from "~/util/cn"
import defaultSettings from "~/defaultSettings"
import Text from "./Text"
import Button from "./Button"

interface Props {
	text: string
	variant: "error" | "success" | "warning" | "info"
	action?: {
		text: string
		callback: () => void
	}
}

const Toast = forwardRef<HTMLLIElement, Props>(
	({ text, variant, action }, ref) => {
		return (
			<ToastPrimitive.Root
				ref={ref}
				duration={
					action !== undefined
						? 10 * 1000
						: variant !== "success"
						  ? 7.5 * 1000
						  : 3 * 1000
				}
				className={cn(
					"flex transform items-center justify-between rounded-lg border bg-white px-3 py-2 animate-in slide-in-from-right data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:transition-transform data-[state=closed]:animate-out data-[state=closed]:fade-out data-[swipe=end]:slide-out-to-right",
					{
						error: "border-error",
						success: "border-success",
						warning: "border-warning",
						info: "border-border",
					}[variant],
				)}
			>
				<ToastPrimitive.Description>
					<Text variant="prose">{text}</Text>
				</ToastPrimitive.Description>

				{action !== undefined && (
					<ToastPrimitive.Action altText={action.text} asChild>
						<Button
							onClick={action.callback}
							size="small"
							variant="light"
						>
							{action.text}
						</Button>
					</ToastPrimitive.Action>
				)}
			</ToastPrimitive.Root>
		)
	},
)

Toast.displayName = "Toast"

export default Toast

const useToast = create<{
	toasts: {
		text: string
		variant: "error" | "success" | "warning" | "info"
		action?: {
			text: string
			callback: () => void
		}
	}[]
	showToast: (toast: {
		text: string
		variant: "error" | "success" | "warning" | "info"
		action?: {
			text: string
			callback: () => void
		}
	}) => void
}>((set, get) => ({
	toasts: [],
	showToast: (toast) => {
		set({
			toasts: [...get().toasts, toast],
		})
	},
}))

export function ToastProvider({ children }: React.PropsWithChildren) {
	const toasts = useToast((state) => state.toasts)

	return (
		<ToastPrimitive.Provider swipeDirection="right">
			{children}

			<ToastPrimitive.Viewport
				style={{
					bottom: 12,
					right: defaultSettings.sideBarWidth + 12,
				}}
				className="fixed z-50 m-0 flex w-96 max-w-[100vw] flex-col gap-2.5 outline-none"
			/>

			{toasts.map(({ text, variant, action }, index) => (
				<Toast
					key={index}
					text={text}
					variant={variant}
					action={action}
				/>
			))}
		</ToastPrimitive.Provider>
	)
}

export function useShowToast() {
	return useToast((state) => state.showToast)
}
