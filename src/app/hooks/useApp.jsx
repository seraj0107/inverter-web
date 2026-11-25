import { useAuth } from '../../features/auth/hooks/useAuth.js'
import { useTheme } from '../../features/theme/hooks/useTheme.js'

export function useApp() {
  const auth = useAuth()
  const theme = useTheme()

  return { ...auth, ...theme }
}
