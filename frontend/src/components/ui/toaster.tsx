"use client"

// Update the import path if the hook is located elsewhere, for example:
// Update the import path below if your use-toast hook is located elsewhere
// Update the import path below if your use-toast hook is located elsewhere
import { useToast } from "../../hooks/use-toast"
// Or, if the file does not exist, create 'use-toast.ts' in 'src/hooks' with the appropriate hook implementation.
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
