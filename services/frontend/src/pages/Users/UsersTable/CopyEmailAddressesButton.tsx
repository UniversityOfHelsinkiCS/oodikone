import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

import { CopyAllIcon } from '@/theme'

export const CopyEmailAddressesButton = ({ userEmails }: { userEmails: string[] }) => {
  const copyEmailsToClipboard = () => {
    void navigator.clipboard.writeText(userEmails.join('; '))
  }

  return (
    <Tooltip arrow placement="right" title="Copy the email addresses of all users to clipboard">
      <Button
        data-cy="copy-email-addresses-button"
        onClick={copyEmailsToClipboard}
        startIcon={<CopyAllIcon />}
        variant="contained"
      >
        Copy email addresses
      </Button>
    </Tooltip>
  )
}
