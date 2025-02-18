import { CopyAll as CopyAllIcon } from '@mui/icons-material'
import { Button, Tooltip } from '@mui/material'

export const CopyEmailAddressesButton = ({ userEmails }: { userEmails: string[] }) => {
  const copyEmailsToClipboard = () => {
    void navigator.clipboard.writeText(userEmails.join('; '))
  }

  return (
    <Tooltip arrow placement="right" title="Copy the email addresses of all users to clipboard">
      <Button onClick={copyEmailsToClipboard} startIcon={<CopyAllIcon />} variant="contained">
        Copy email addresses
      </Button>
    </Tooltip>
  )
}
