import { useEffect, useRef } from 'react'

export function useOutsideClick(onClickOutside) {
  const ref = useRef(null)

  useEffect(() => {
    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClickOutside(event)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [onClickOutside])

  return ref
}
