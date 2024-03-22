import React, { useEffect, useState } from 'react'
import { Button, Form, Header, Icon, Message, Modal, TextArea } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { useSendFeedbackMutation } from '@/redux/feedback'

export const Feedback = () => {
  const [feedback, setFeedback] = useState('')
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  useTitle('Feedback')

  const [sendFeedback, { isError, isLoading, isSuccess }] = useSendFeedbackMutation()

  useEffect(() => {
    if (!isSuccess) return undefined
    setFeedback('')
    setShowSuccess(true)
    const timer = setTimeout(() => setShowSuccess(false), 10000)
    return () => clearTimeout(timer)
  }, [isSuccess])

  useEffect(() => {
    if (!isError) return undefined
    setShowError(true)
    const timer = setTimeout(() => setShowError(false), 10000)
    return () => clearTimeout(timer)
  }, [isError])

  const handleTyping = ({ target }) => {
    setFeedback(target.value)
  }

  const handleSubmit = event => {
    event.preventDefault()
    sendFeedback({ content: feedback })
  }

  return (
    <div align="center">
      {showSuccess && (
        <Message icon positive size="large" style={{ marginTop: '40px', maxWidth: 700 }}>
          <Icon name="envelope" />
          <Message.Content style={{ textAlign: 'left' }}>
            <Message.Header>Your message was sent</Message.Header>
            <p>Thank you for contacting us. We’ll get back to you soon.</p>
          </Message.Content>
        </Message>
      )}
      {showError && (
        <Message icon negative size="large" style={{ marginTop: '40px', maxWidth: 700 }}>
          <Icon name="warning sign" />
          <Message.Content style={{ textAlign: 'left' }}>
            <Message.Header>Your message was not sent</Message.Header>
            <p>An error occured while trying to send your message. Please try again.</p>
          </Message.Content>
        </Message>
      )}
      <Header as="h1" style={{ margin: '40px 0' }} textAlign="center">
        Give feedback
        <Header.Subheader style={{ marginTop: '20px' }}>
          We are constantly improving Oodikone. Please share your thoughts using the form below, or contact us at{' '}
          <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
          <div style={{ marginTop: '10px' }}>You can write in Finnish or English.</div>
        </Header.Subheader>
      </Header>
      <Form>
        <TextArea
          onChange={handleTyping}
          placeholder="Tell us more"
          style={{ minHeight: 400, maxWidth: 1000 }}
          value={feedback}
        />
        <div>
          <Modal
            actions={[
              'Cancel',
              {
                key: 'send',
                content: 'Send',
                positive: true,
                disabled: isLoading,
                onClick: event => handleSubmit(event),
              },
            ]}
            header="Sending mail to Toska"
            trigger={
              <Button disabled={!feedback.trim().length || isLoading} primary style={{ marginTop: '30px' }}>
                Submit
              </Button>
            }
          />
        </div>
      </Form>
    </div>
  )
}
