import { AlertColor } from '@mui/material'
import { createContext, useState, useContext, ReactNode } from 'react'

interface StatusNotificationContext {
  message: string
  severity: AlertColor
  open: boolean
  setStatusNotification: (message: string, severity?: AlertColor) => void
  closeNotification: () => void
}

const StatusNotificationContext = createContext<StatusNotificationContext | undefined>(undefined)

export const useStatusNotification = () => {
  const context = useContext(StatusNotificationContext)
  if (!context) {
    throw new Error('useStatusNotification must be used within a StatusNotificationProvider')
  }
  return context
}

export const StatusNotificationProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<string>('')
  const [severity, setSeverity] = useState<AlertColor>('info')

  const open = Boolean(message)

  const setStatusNotification = (message: string, severity: AlertColor = 'info') => {
    setMessage(message)
    setSeverity(severity)
  }

  const closeNotification = () => {
    setMessage('')
  }

  return (
    <StatusNotificationContext.Provider value={{ message, severity, open, setStatusNotification, closeNotification }}>
      {children}
    </StatusNotificationContext.Provider>
  )
}
