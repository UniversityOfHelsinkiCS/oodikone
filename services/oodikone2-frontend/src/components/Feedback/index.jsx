import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Form, TextArea, Button, Confirm } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import { sendFeedbackAction } from '../../redux/feedback'

const Feedback = ({ sendFeedback, success }) => {
  const [feedback, setFeedback] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (success) {
      setFeedback('')
      setConfirm(false)
      setShow(true)
      setTimeout(() => {
        setShow(false)
      }, 10000)
    } else {
      setConfirm(false)
    }
  }, [success])

  const open = () => setConfirm(true)

  const close = () => setConfirm(false)

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
      <Form >
        Questions/feedback:
        <div>
          <TextArea placeholder="Tell us more" style={{ minHeight: 400, maxWidth: 1000, maxHeight: 400 }} onChange={handleTyping} value={feedback} />
        </div>
        <div>
          <Button onClick={open}> submit</Button>
          <Confirm
            open={confirm}
            onCancel={close}
            onConfirm={handleSubmit}
            content="Sending mail to Toska"
            cancelButton="Cancel"
            confirmButton="Confirm"
          />
        </div>
      </Form>
    </div >
  )
}

const mapStateToProps = ({ feedback }) => ({
  success: feedback.success
})

Feedback.propTypes = {
  sendFeedback: PropTypes.func.isRequired,
  success: PropTypes.bool.isRequired
}

export default withRouter(connect(mapStateToProps, { sendFeedback: sendFeedbackAction })(Feedback))
