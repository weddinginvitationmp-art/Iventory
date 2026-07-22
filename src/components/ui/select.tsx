import { cn } from '../../lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-150 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
