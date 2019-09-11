import React, { useState, useEffect, useCallback, Fragment } from 'react'
import { bool, func, string } from 'prop-types'
import { Button, Modal, Message } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { sendEmail, clearError } from '../../redux/userAccessEmail'

const SendEmailButton = props => (
  <Button
    basic
    fluid
    positive
    content="Send email about receiving access to oodikone ..."
    {...props}
  />
)

const DisabledEmailButton = props => (
  <Button
    basic
    fluid
    disabled
    content="Cannot send email - user has no email address"
    {...props}
  />
)

const EmailConfirm = ({
  userEmail,
  isLoading,
  error,
  open,
  onCancel,
  onConfirm
}) => (
  <Modal open={open} onClose={onCancel}>
    <Modal.Header>Send email about receiving access to oodikone</Modal.Header>
    <Modal.Content scrolling>
      <Modal.Description>
        {error && <SendFailBanner userEmail={userEmail} error={error} />}
        <p>
          Do you want to notify this person by email (to {userEmail}) about
          receiving access to oodikone?
        </p>
      </Modal.Description>
    </Modal.Content>
    <Modal.Actions>
      <Button disabled={isLoading} onClick={onCancel}>
        Cancel
      </Button>
      <Button
        primary
        onClick={onConfirm}
        disabled={isLoading}
        loading={isLoading}
      >
        Send
      </Button>
    </Modal.Actions>
  </Modal>
)

EmailConfirm.defaultProps = {
  error: undefined
}

EmailConfirm.propTypes = {
  userEmail: string.isRequired,
  error: string,
  open: bool.isRequired,
  isLoading: bool.isRequired,
  onCancel: func.isRequired,
  onConfirm: func.isRequired
}

const SendFailBanner = ({ userEmail, error }) => (
  <Message
    error
    header={`Email could not be sent to ${userEmail}`}
    list={[error]}
  />
)

SendFailBanner.propTypes = {
  userEmail: string.isRequired,
  error: string.isRequired
}

const EmailNotification = ({
  userEmail,
  onEmailSend,
  isSendLoading,
  sendError,
  onSendErrorClear
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    // Close confirmation box if email was sent successfully, otherwise
    // keep open to show error message
    if (!isSendLoading && !sendError) {
      setConfirmOpen(false)
    }
  }, [isSendLoading, sendError])

  const handleCancel = useCallback(() => {
    onSendErrorClear()
    setConfirmOpen(false)
  }, [setConfirmOpen])

  const handleButtonClick = useCallback(() => setConfirmOpen(true), [
    setConfirmOpen
  ])

  const handleConfirm = useCallback(() => {
    // don't close confirm yet, wait until response because we'll need to
    // display an error if it failed
    onEmailSend(userEmail)
  }, [setConfirmOpen, onEmailSend, userEmail])

  const userIsMissingEmail = !userEmail

  return userIsMissingEmail ? (
    <DisabledEmailButton />
  ) : (
    <Fragment>
      <SendEmailButton onClick={handleButtonClick} />
      <EmailConfirm
        open={confirmOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        userEmail={userEmail}
        error={sendError}
        isLoading={isSendLoading}
      />
    </Fragment>
  )
}

EmailNotification.defaultProps = {
  userEmail: undefined,
  sendError: undefined
}

EmailNotification.propTypes = {
  userEmail: string,
  onEmailSend: func.isRequired,
  isSendLoading: bool.isRequired,
  sendError: string,
  onSendErrorClear: func.isRequired
}

const mapStateToProps = ({ userAccessEmail }) => ({
  isSendLoading: userAccessEmail.sending.pending,
  sendError: userAccessEmail.sending.error
})

const mapDispatchToProps = {
  onEmailSend: sendEmail,
  onSendErrorClear: clearError
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EmailNotification)
