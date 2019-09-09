import React, { useState, useCallback, Fragment } from 'react'
import { func, string } from 'prop-types'
import { Button, Confirm, Divider } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { sendEmail } from '../../redux/users'

const EmailButton = props => (
  <Button basic fluid positive content="Send email" {...props} />
)
const DisabledEmailbutton = props => (
  <Button basic fluid disabled content="User has no email" {...props} />
)

const EmailNotification = ({ userEmail, onEmailSend }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleCancel = useCallback(() => setConfirmOpen(false), [
    setConfirmOpen
  ])

  const handleButtonClick = useCallback(() => setConfirmOpen(true), [
    setConfirmOpen
  ])

  const handleConfirm = useCallback(() => {
    setConfirmOpen(false)
    onEmailSend(userEmail)
  }, [setConfirmOpen, onEmailSend, userEmail])

  const userHasEmail = !!userEmail

  return (
    <Fragment>
      Send an email about receiving access to oodikone
      <Divider />
      {userHasEmail ? (
        <EmailButton onClick={handleButtonClick} />
      ) : (
        <DisabledEmailbutton />
      )}
      <Confirm
        open={confirmOpen}
        cancelButton="no"
        confirmButton="send"
        content={`Do you want to notify this person by email (to ${userEmail}) about receiving access to oodikone?`}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </Fragment>
  )
}

EmailNotification.defaultProps = {
  userEmail: undefined
}

EmailNotification.propTypes = {
  userEmail: string,
  onEmailSend: func.isRequired
}

export default connect(
  null,
  { onEmailSend: sendEmail }
)(EmailNotification)
