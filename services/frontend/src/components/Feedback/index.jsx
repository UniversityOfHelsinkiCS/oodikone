import React, { useState, useEffect } from 'react'
import { Form, TextArea, Button, Modal, Message, Icon, Header } from 'semantic-ui-react'

import { useSendFeedbackMutation } from 'redux/feedback'
import { useTitle } from '../../common/hooks'

const Feedback = () => {
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
      <Header as="h1" textAlign="center" style={{ margin: '40px 0' }}>
        Give feedback
      </Header>
      <Form>
        <TextArea
          placeholder="Tell us more"
          style={{ minHeight: 400, maxWidth: 1000 }}
          onChange={handleTyping}
          value={feedback}
        />
        <div>
          <Modal
            trigger={
              <Button primary style={{ marginTop: '30px' }} disabled={!feedback.trim().length || isLoading}>
                Submit
              </Button>
            }
            header="Sending mail to Toska"
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
          />
        </div>
      </Form>
    </div>
  )
}

export default Feedback
