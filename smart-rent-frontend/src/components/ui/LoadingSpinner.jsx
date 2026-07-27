export default function LoadingSpinner({size = 'md', color = 'brand',}) {
  const sizes = {
    sm:  'h-4 w-4 border-2',
    md:  'h-8 w-8 border-2',
    lg:  'h-12 w-12 border-4',
    xl:  'h-16 w-16 border-4',
  }

  const colors = {
    brand: 'border-brand-green',
    white: 'border-white',
    gray:  'border-gray-400',
  }

  return (
      <div
          className={`
        animate-spin rounded-full
        border-gray-200
        ${sizes[size]}
        border-t-${colors[color].split('-').slice(1).join('-')}
      `}
          style={{
            borderTopColor: color === 'white'
                ? '#fff'
                : color === 'gray'
                    ? '#9ca3af'
                    : '#1D9E75',
          }}
          role="status"
          aria-label="Loading"
      />
  )
}