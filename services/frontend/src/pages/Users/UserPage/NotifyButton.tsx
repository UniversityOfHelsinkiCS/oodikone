import EmailIcon from '@mui/icons-material/Email'
import SendIcon from '@mui/icons-material/Send'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Modal from '@mui/material/Modal'
import Stack from '@mui/material/Stack'

import { useEffect, useState } from 'react'

import { useStatusNotification } from '@/components/material/StatusNotificationContext'
import { useGetUserAccessEmailPreviewQuery, useSendUserAccessEmailMutation } from '@/redux/users'
import { EmailPreview } from './EmailPreview'

export const NotifyButton = ({ userEmail }: { userEmail: string }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { setStatusNotification } = useStatusNotification()

  const [sendEmail, { isLoading: sendIsLoading, isError: sendIsError, isSuccess: sendIsSuccess }] =
    useSendUserAccessEmailMutation()
  const { data: email, isLoading: previewIsLoading, isError: previewIsError } = useGetUserAccessEmailPreviewQuery()

  useEffect(() => {
    if (sendIsSuccess) {
      setStatusNotification(`Email sent to ${userEmail}`, 'success')
    } else if (sendIsError) {
      setStatusNotification(`Email could not be sent to ${userEmail}`, 'error')
    }
  }, [sendIsError, sendIsSuccess, userEmail])

  const onClick = async () => {
    await sendEmail(userEmail)
    setConfirmOpen(false)
  }

  return (
    <>
      <Button
        color="primary"
        data-cy="notify-button"
        disabled={!userEmail || previewIsLoading || previewIsError}
        onClick={() => setConfirmOpen(true)}
        size="small"
        startIcon={<EmailIcon />}
        variant="outlined"
      >
        Notify
      </Button>
      {!previewIsLoading && !previewIsError && email ? (
        <Modal onClose={() => setConfirmOpen(false)} open={confirmOpen}>
          <Card
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: theme => theme.breakpoints.values.md,
              transform: 'translate(-50%, -50%)',
              boxShadow: 24,
              padding: 1,
            }}
            variant="outlined"
          >
            <CardHeader subheader="Send email about receiving access to Oodikone" title="Notify user" />
            <CardContent>
              <EmailPreview email={email} userEmail={userEmail} />
            </CardContent>
            <CardContent>
              <Stack direction="row" gap={1} justifyContent="flex-end">
                <Button
                  disabled={previewIsLoading || previewIsError || sendIsLoading}
                  onClick={() => setConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={previewIsLoading || previewIsError || sendIsLoading || sendIsSuccess}
                  endIcon={<SendIcon />}
                  loading={sendIsLoading}
                  onClick={() => void onClick()}
                  variant="contained"
                >
                  Send
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Modal>
      ) : null}
    </>
  )
}
