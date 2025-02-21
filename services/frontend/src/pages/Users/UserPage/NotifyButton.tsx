import { Email as EmailIcon, Send as SendIcon } from '@mui/icons-material'
import { AlertProps, Button, Card, CardContent, CardHeader, Modal, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import { StatusNotification } from '@/components/material/StatusNotification'
import { useGetUserAccessEmailPreviewQuery, useSendUserAccessEmailMutation } from '@/redux/users'
import { EmailPreview } from './EmailPreview'

export const NotifyButton = ({ userEmail }: { userEmail: string }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: undefined as AlertProps['severity'],
  })
  const [sendEmail, { isLoading: sendIsLoading, isError: sendIsError, isSuccess: sendIsSuccess }] =
    useSendUserAccessEmailMutation()
  const { data: email, isLoading: previewIsLoading, isError: previewIsError } = useGetUserAccessEmailPreviewQuery()

  useEffect(() => {
    if (sendIsSuccess) {
      setNotification({ open: true, message: `Email sent to ${userEmail}`, severity: 'success' })
    } else if (sendIsError) {
      setNotification({ open: true, message: `Email could not be sent to ${userEmail}`, severity: 'error' })
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
      {!previewIsLoading && !previewIsError && email && (
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
                  onClick={onClick}
                  variant="contained"
                >
                  Send
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Modal>
      )}
      <StatusNotification
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        open={notification.open}
        severity={notification.severity}
      />
    </>
  )
}
