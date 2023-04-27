import React, { useState } from 'react'
import { Message, Button } from 'semantic-ui-react'

const RightsNotification = ({ discardedStudentNumbers }) => {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return null
  }

  return (
    <Message data-cy="rights-notification">
      <Message.Header>Invalid or forbidden student numbers</Message.Header>
      <p style={{ maxWidth: '50em' }}>
        The following students information could not be displayed. This could be either because they do not exist, or
        you do not have the right to view their information.
      </p>
      <ul>
        {[...new Set(discardedStudentNumbers)].map(num => (
          <li key={num}>{num}</li>
        ))}
      </ul>
      <Button onClick={() => setVisible(false)}>Hide notification</Button>
    </Message>
  )
}

export default RightsNotification
