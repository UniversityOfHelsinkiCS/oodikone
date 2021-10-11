import React, { useState, useEffect, useCallback } from 'react'
import { Button, Icon, Modal, Message } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { sendEmail, clearErrors } from '../../redux/userAccessEmail'
import EmailPreview from './EmailPreview'

const SendEmailButton = props => <Button basic fluid positive content="Preview email ..." {...props} />

const DisabledEmailButton = props => (
  <Button basic fluid disabled content="Cannot send email - user has no email address" {...props} />
)

const SendFailBanner = ({ userEmail, error }) => (
  <Message error header={`Email could not be sent to ${userEmail}`} list={[error]} />
)

const EmailConfirm = ({ userEmail, isLoading, error, open, onCancel, onConfirm }) => (
  <Modal open={open} onClose={onCancel}>
    <Modal.Header>Send email about receiving access to oodikone</Modal.Header>
    <Modal.Content scrolling>
      <Modal.Description>
        {error && <SendFailBanner userEmail={userEmail} error={error} />}
        <EmailPreview userEmail={userEmail} />
      </Modal.Description>
    </Modal.Content>
    <Modal.Actions>
      <Button disabled={isLoading} onClick={onCancel}>
        Cancel
      </Button>
      <Button primary onClick={onConfirm} disabled={isLoading} loading={isLoading} icon labelPosition="right">
        Send
        <Icon name="send" />
      </Button>
    </Modal.Actions>
  </Modal>
)

const EmailNotification = ({ userEmail, onEmailSend, isSendLoading, sendError, onClearErrors }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    // Close confirmation box if email was sent successfully, otherwise
    // keep open to show error message
    if (!isSendLoading && !sendError) {
      setConfirmOpen(false)
    }
  }, [isSendLoading, sendError])

  const handleCancel = useCallback(() => {
    onClearErrors()
    setConfirmOpen(false)
  }, [setConfirmOpen])

  const handleButtonClick = useCallback(() => {
    setConfirmOpen(true)
  }, [setConfirmOpen])

  const handleConfirm = useCallback(() => {
    // don't close confirm yet, wait until response because we'll need to
    // display an error if it failed
    onEmailSend(userEmail)
  }, [setConfirmOpen, onEmailSend, userEmail])

  const userIsMissingEmail = !userEmail

  return userIsMissingEmail ? (
    <DisabledEmailButton />
  ) : (
    <>
      <SendEmailButton onClick={handleButtonClick} />
      <EmailConfirm
        open={confirmOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        userEmail={userEmail}
        error={sendError}
        isLoading={isSendLoading}
      />
    </>
  )
}

const mapStateToProps = ({ userAccessEmail }) => ({
  isSendLoading: userAccessEmail.sending.pending,
  sendError: userAccessEmail.sending.error,
})

const mapDispatchToProps = {
  onEmailSend: sendEmail,
  onClearErrors: clearErrors,
}

export default connect(mapStateToProps, mapDispatchToProps)(EmailNotification)
