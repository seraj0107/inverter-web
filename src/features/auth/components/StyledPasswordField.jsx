import { forwardRef, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import StyledField from './StyledField.jsx'

const StyledPasswordField = forwardRef(function StyledPasswordField(
  { theme, rightSlot, ...props },
  ref,
) {
  const [show, setShow] = useState(false)

  return (
    <StyledField
      ref={ref}
      theme={theme}
      icon={Lock}
      type={show ? 'text' : 'password'}
      rightSlot={
        rightSlot ?? (
          <button
            type="button"
            onClick={() => setShow((current) => !current)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="text-gray-400 transition-colors hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )
      }
      {...props}
    />
  )
})

export default StyledPasswordField
