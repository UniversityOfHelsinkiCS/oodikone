import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Modal from '@mui/material/Modal'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useStatusNotification } from '@/components/StatusNotification/Context'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useSendFeedbackMutation } from '@/redux/feedback'
import { SendIcon } from '@/theme'

export const Feedback = () => {
  useTitle('Feedback')

  const [feedback, setFeedback] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const { setStatusNotification } = useStatusNotification()

  const { email } = useGetAuthorizedUserQuery()
  const [sendFeedback, { isError, isLoading, isSuccess }] = useSendFeedbackMutation()

  useEffect(() => {
    if (isSuccess) {
      setFeedback('')
      setStatusNotification(
        'Your message was sent. Thank you for contacting us. We will get back to you soon.',
        'success'
      )
    }
  }, [isSuccess])

  useEffect(() => {
    if (isError) {
      setStatusNotification(
        'Your message was not sent. An error occurred while trying to send your message. Please try again.',
        'error'
      )
    }
  }, [isError])

  const handleTyping = event => {
    setFeedback(event.target.value)
  }

  const handleSubmit = async () => {
    await sendFeedback({ content: feedback })
    setModalOpen(false)
  }

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Feedback" />
      <Box textAlign="center">
        <Typography>
          We are constantly improving Oodikone. Please share your thoughts using the form below, or contact us at
          <br />
          <Link href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</Link>. You can write in Finnish or English.
        </Typography>
      </Box>
      <Box
        autoComplete="off"
        component="form"
        noValidate
        sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}
      >
        <Tooltip arrow title="Your email address is based on your user account. We will reply to this address.">
          <TextField
            disabled
            fullWidth
            label="Your email address"
            placeholder="Your email address"
            sx={{ mt: 2 }}
            value={email}
            variant="outlined"
          />
        </Tooltip>
        <TextField
          fullWidth
          label="Your feedback"
          multiline
          onChange={handleTyping}
          placeholder="Write your feedback here"
          rows={15}
          sx={{ my: 2 }}
          value={feedback}
          variant="outlined"
        />
        <Button
          color="primary"
          disabled={!feedback.trim().length || isLoading}
          onClick={() => setModalOpen(true)}
          variant="contained"
        >
          Submit
        </Button>
      </Box>
      <Modal onClose={() => setModalOpen(false)} open={modalOpen}>
        <Box
          bgcolor="background.paper"
          borderRadius={2}
          boxShadow={24}
          maxWidth="400px"
          p={4}
          position="absolute"
          sx={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          width="100%"
        >
          <Typography mb={2} variant="h6">
            Sending feedback to Toska
          </Typography>
          <Box display="flex" justifyContent="space-between">
            <Button disabled={isLoading} onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              disabled={!feedback.trim().length || isLoading}
              endIcon={<SendIcon />}
              onClick={() => void handleSubmit()}
              variant="contained"
            >
              Send
            </Button>
          </Box>
        </Box>
      </Modal>
    </PageLayout>
  )
}
