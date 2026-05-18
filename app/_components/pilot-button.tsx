'use client'

export default function PilotButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      className={className}
      onClick={() => window.dispatchEvent(new Event('open-pilot-modal'))}
    >
      {children}
    </button>
  )
}