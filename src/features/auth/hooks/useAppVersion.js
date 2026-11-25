import { useCallback, useState } from 'react'
import { APP_VERSIONS, DEFAULT_VERSION_TYPE, VERSION_TYPES } from '../../../config/env.js'

export default function useAppVersion(versionType) {
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((count) => count + 1), [])

  const isValid = VERSION_TYPES.some((item) => item.value === versionType)

  return {
    status: isValid ? 'success' : 'error',
    version: isValid ? APP_VERSIONS[versionType] : APP_VERSIONS[DEFAULT_VERSION_TYPE],
    error: isValid ? null : 'Unsupported app version. Please select another login type.',
    isReady: isValid,
    retry,
    attempt,
  }
}
