import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Toast, type ToastType } from '@/components/ui/Toast'

interface ToastOptions {
  label: string
  /** Visual variant per Figma (Alert component): success, brand, or neutral. Defaults to 'neutral'. */
  type?: ToastType
  /** When set, renders a clickable action on the right side. */
  actionLabel?: string
  onAction?: () => void
  /** Show the leading circle-check icon. Defaults to true. */
  leadingIcon?: boolean
  /** Auto-dismiss after this many ms. Defaults to 5000. Pass 0 to disable. */
  durationMs?: number
}

interface ActiveToast extends ToastOptions {
  id: number
}

interface ToastValue {
  showToast: (opts: ToastOptions) => void
  dismissToast: () => void
}

const ToastContext = createContext<ToastValue | null>(null)

let toastSeq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)

  const showToast = useCallback((opts: ToastOptions) => {
    setToast({ ...opts, id: ++toastSeq })
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  useEffect(() => {
    if (!toast) return
    const duration = toast.durationMs ?? 5000
    if (duration <= 0) return
    const timer = setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, duration)
    return () => clearTimeout(timer)
  }, [toast])

  const value = useMemo<ToastValue>(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast &&
        createPortal(
          <div className="fixed bottom-4 left-4 z-[100] pointer-events-none">
            <Toast
              className="pointer-events-auto"
              label={toast.label}
              type={toast.type ?? 'neutral'}
              leadingIcon={toast.leadingIcon ?? true}
              actionLabel={toast.actionLabel}
              onAction={
                toast.onAction
                  ? () => {
                      toast.onAction?.()
                      dismissToast()
                    }
                  : undefined
              }
            />
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
