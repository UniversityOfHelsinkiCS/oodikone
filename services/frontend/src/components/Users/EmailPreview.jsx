import React from 'react'
import { Label, Message, Segment } from 'semantic-ui-react'

const Light = ({ children }) => <span style={{ fontWeight: 'normal' }}>{children}</span>

const EmailHeader = ({ isLoading, subject, to }) => {
  if (isLoading) {
    return (
      <Segment>
        <Label attached="top">Loading preview...</Label>
      </Segment>
    )
  }

  return (
    <>
      <Segment>
        <Label attached="top">
          <Light>To: </Light>
          {to}
        </Label>
      </Segment>
      <Segment>
        <Label attached="top">
          <Light>Subject: </Light>
          {subject}
        </Label>
      </Segment>
    </>
  )
}

export const EmailPreview = ({ userEmailAddress, email, isLoading, isError }) => {
  if (isLoading) {
    return (
      <Segment.Group>
        <EmailHeader isLoading />
        <Segment height="200px" loading placeholder style={{ background: '#f7f7f7' }} />
      </Segment.Group>
    )
  }

  if (isError) {
    return <Message error header="Could not get email preview" />
  }

  return (
    <Segment.Group>
      <EmailHeader isLoading={false} subject={email.subject} to={userEmailAddress} />
      <Segment style={{ background: '#f7f7f7' }}>
        <iframe
          height="200px"
          referrerPolicy="no-referrer"
          sandbox=""
          src={`data:text/html;base64,${btoa(email.html)}`}
          srcDoc={email.html}
          style={{ border: 'none' }}
          title="User access email preview"
          width="100%"
        />
      </Segment>
    </Segment.Group>
  )
}
