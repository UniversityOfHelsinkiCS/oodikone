import { AlertColor } from '@mui/material'
import { useState } from 'react'

export const useStatusNotification = () => {
  const [message, setMessage] = useState<string>('')
  const [severity, setSeverity] = useState<AlertColor>('info')

  const open = Boolean(message)

  const setStatusNotification = (message: string, severity: AlertColor = 'info') => {
    setMessage(message)
    setSeverity(severity)
  }

  return [message, open, severity, setStatusNotification] as const
}
