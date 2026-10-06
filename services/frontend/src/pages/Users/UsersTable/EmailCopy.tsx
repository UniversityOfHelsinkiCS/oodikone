import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

import { useStatusNotification } from '@/components/StatusNotification/Context'
import { ContentCopyIcon } from '@/theme'
import { User } from '@/types/api/users'

export const CopyEmailAddressesButton = ({ users }: { users: User[] }) => {
  const { setStatusNotification, closeNotification } = useStatusNotification()

  const copyEmailsToClipboard = async () => {
    const emails = users.map(user => user.email).filter(Boolean)
    await navigator.clipboard.writeText(emails.join('; '))
    setStatusNotification(`Copied ${emails.length} email addresses`)
    setTimeout(() => closeNotification(), 5000)
  }

  return (
    <Tooltip arrow placement="right" title="Copy the email addresses of the listed users to clipboard">
      <Button
        data-cy="copy-email-addresses-button"
        onClick={() => void copyEmailsToClipboard()}
        startIcon={<ContentCopyIcon />}
        variant="contained"
      >
        Copy email addresses
      </Button>
    </Tooltip>
  )
}
