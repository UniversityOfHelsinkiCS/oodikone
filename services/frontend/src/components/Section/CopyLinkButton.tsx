import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useRef } from 'react'

import { useStatusNotification } from '@/components/StatusNotification/Context'
import { LinkIcon } from '@/theme'

export const CopyLinkButton = ({
  buildUrl,
  cypress,
  target,
}: {
  buildUrl: (href: string) => string
  cypress: string
  target: 'section' | 'panel'
}) => {
  const { setStatusNotification, closeNotificationIfShowing } = useStatusNotification()
  const closeTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const label = `Copy link to this ${target}`

  const copyLinkToClipboard = async () => {
    clearTimeout(closeTimeout.current)
    try {
      await navigator.clipboard.writeText(buildUrl(window.location.href))
    } catch {
      setStatusNotification(`Could not copy the link to the ${target}`, 'error')
      return
    }
    const message = `Copied link to ${target}`
    setStatusNotification(message)
    closeTimeout.current = setTimeout(() => closeNotificationIfShowing(message), 5000)
  }

  return (
    <Tooltip arrow title={label}>
      <IconButton
        aria-label={label}
        data-cy={`${cypress}-copy-link-button`}
        onClick={() => void copyLinkToClipboard()}
        size="small"
      >
        <LinkIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}
