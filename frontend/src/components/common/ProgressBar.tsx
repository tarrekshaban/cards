interface ProgressBarProps {
  value: number
  max: number
  className?: string
}

export default function ProgressBar({ value, max, className = '' }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className={`h-1.5 bg-surface-muted border border-border ${className}`}>
      <div
        className="h-full bg-text-muted transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
