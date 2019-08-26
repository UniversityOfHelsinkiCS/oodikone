import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Form, TextArea, Button, Modal } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import { sendFeedbackAction } from '../../redux/feedback'

const Feedback = ({ sendFeedback, success, pending, error }) => {
  const [feedback, setFeedback] = useState('')
  const [showError, setError] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (success) {
      setFeedback('')
      setShow(true)
      setTimeout(() => {
        setShow(false)
      }, 10000)
    }
    if (error) {
      setError(true)
      setTimeout(() => {
        setError(false)
      }, 10000)
    }
  }, [pending])

  const handleTyping = ({ target }) => {
    setFeedback(target.value)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendFeedback(feedback)
  }

  return (
    <div align="center">
      {show === true ? (
        <div className="ui positive message" align="center" style={{ maxWidth: 1000 }}>
          <div className="header">
            Your question/feedback was sent
          </div>
          <p>Thank you for contacting us. We will contact you soon.</p>
        </div>) : null}
      {showError === true ? (
        <div className="ui negative message" align="center" style={{ maxWidth: 1000 }}>
          <div className="header">
            Your question/feedback was not sent
          </div>
          <p>An error occured while trying to send your message. Please try again.</p>
        </div>) : null}
      <Form >
        Questions/feedback:
        <div>
          <TextArea placeholder="Tell us more" style={{ minHeight: 400, maxWidth: 1000 }} onChange={handleTyping} value={feedback} />
        </div>
        <div>
          <Modal
            trigger={<Button disabled={feedback.length < 1 || pending}> submit</Button>}
            header="Sending mail to Toska"
            actions={[
              'Cancel',
              {
                key: 'send',
                content: 'Send',
                positive: true,
                disabled: pending,
                onClick: event => handleSubmit(event)
              }
            ]}
          />
        </div>
      </Form>
    </div >
  )
}

const mapStateToProps = ({ feedback }) => ({
  success: feedback.success,
  pending: feedback.pending,
  error: feedback.error
})

Feedback.propTypes = {
  sendFeedback: PropTypes.func.isRequired,
  success: PropTypes.bool.isRequired,
  pending: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired
}

export default withRouter(connect(mapStateToProps, { sendFeedback: sendFeedbackAction })(Feedback))
