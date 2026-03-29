import clsx from 'clsx'

type Variant = 'green' | 'red' | 'gray' | 'yellow' | 'blue'

interface Props {
  variant: Variant
  children: React.ReactNode
  pulse?: boolean
}

const styles: Record<Variant, string> = {
  green:  'bg-primary-900 text-primary-400 border border-primary-800',
  red:    'bg-red-900 text-red-400 border border-red-800',
  gray:   'bg-gray-800 text-gray-400 border border-gray-700',
  yellow: 'bg-yellow-900 text-yellow-400 border border-yellow-800',
  blue:   'bg-blue-900 text-blue-400 border border-blue-800',
}

export default function StatusBadge({ variant, children, pulse }: Props) {
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', styles[variant])}>
      {pulse && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', {
        'bg-primary-400': variant === 'green',
        'bg-red-400': variant === 'red',
        'bg-yellow-400': variant === 'yellow',
        'bg-blue-400': variant === 'blue',
        'bg-gray-400': variant === 'gray',
      })} />}
      {children}
    </span>
  )
}
