/* eslint-disable consistent-return */
import { Send } from '@mui/icons-material'
import { Box, Button, Container, Link, Modal, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { useTitle } from '@/common/hooks'
import { PageTitle } from '@/components/material/PageTitle'
import { StatusNotification } from '@/components/material/StatusNotification'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useSendFeedbackMutation } from '@/redux/feedback'

export const Feedback = () => {
  useTitle('Feedback')

  const [feedback, setFeedback] = useState('')
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const { email } = useGetAuthorizedUserQuery()
  const [sendFeedback, { isError, isLoading, isSuccess }] = useSendFeedbackMutation()

  useEffect(() => {
    if (isSuccess) {
      setFeedback('')
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  useEffect(() => {
    if (isError) {
      setShowError(true)
      const timer = setTimeout(() => setShowError(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [isError])

  const handleTyping = event => {
    setFeedback(event.target.value)
  }

  const handleSubmit = () => {
    sendFeedback({ content: feedback })
    setModalOpen(false)
  }

  return (
    <Container maxWidth="md">
      <StatusNotification
        message="Your message was sent. Thank you for contacting us. We will get back to you soon."
        onClose={() => setShowSuccess(false)}
        open={showSuccess}
        severity="success"
      />
      <StatusNotification
        message="Your message was not sent. An error occurred while trying to send your message. Please try again."
        onClose={() => setShowError(false)}
        open={showError}
        severity="error"
      />
      <Box textAlign="center">
        <PageTitle title="Feedback" />
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
              endIcon={<Send />}
              onClick={handleSubmit}
              variant="contained"
            >
              Send
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  )
}
