import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from '../../features/auth/hooks/authContext.js'
import { authService } from '../../features/auth/services/authService.js'
import { STORAGE_KEYS } from '../../utils/constants.js'
import { getToken, removeToken, setToken } from '../../utils/token.js'

function readUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.user)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export default function AuthProvider({ children }) {
  const [token, setAuthToken] = useState(() => getToken())
  const [user, setUser] = useState(readUser)

  const signIn = useCallback((nextToken, nextUser = null) => {
    setToken(nextToken)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser))
    setAuthToken(nextToken)
    setUser(nextUser)
  }, [])

  const signOut = useCallback(() => {
    removeToken()
    localStorage.removeItem(STORAGE_KEYS.user)
    setAuthToken(null)
    setUser(null)
  }, [])

  const loginWithPassword = useCallback(
    async (account, password, version) => {
      const data = await authService.loginWithPassword(account, password, version)
      signIn(data.token, data.user)
      return data
    },
    [signIn],
  )

  const sendLoginOtp = useCallback((phone, version) => {
    return authService.sendLoginOtp(phone, version)
  }, [])

  const loginWithOtp = useCallback(
    async (phone, code, version) => {
      const data = await authService.loginWithOtp(phone, code, version)
      signIn(data.token, data.user)
      return data
    },
    [signIn],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isAdmin: String(user?.designation || '').toLowerCase() === 'admin',
      versionType: user?.version_type,
      versionNumber: user?.version_number,
      signIn,
      signOut,
      loginWithPassword,
      sendLoginOtp,
      loginWithOtp,
    }),
    [token, user, signIn, signOut, loginWithPassword, sendLoginOtp, loginWithOtp],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
