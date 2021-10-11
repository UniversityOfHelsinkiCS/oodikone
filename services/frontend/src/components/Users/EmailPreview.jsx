import React, { useEffect, Fragment } from 'react'
import { Label, Message, Segment } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getPreview } from '../../redux/userAccessEmail'

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

const EmailPreview = ({ userEmail, isLoading, error, subject, html, onPreviewRequested }) => {
  useEffect(() => {
    onPreviewRequested()
  }, [])

  return (
    <Segment.Group>
      <EmailHeader isLoading={isLoading} subject={subject} to={userEmail} />
      <Segment
        placeholder={isLoading}
        loading={isLoading}
        height={isLoading ? '200px' : undefined}
        style={{ background: '#f7f7f7' }}
      >
        {error && <Message error header="Could not get email preview" list={[error]} />}
        {!isLoading && !error && (
          <iframe
            sandbox=""
            referrerPolicy="no-referrer"
            height="200px"
            width="100%"
            style={{ border: 'none' }}
            title="User access email preview"
            srcDoc={html}
            src={`data:text/html;base64,${btoa(html)}`}
          />
        )}
      </Segment>
    </Segment.Group>
  )
}

const mapStateToProps = ({ userAccessEmail: { preview } }) => {
  const { pending, error, data } = preview
  return {
    isLoading: pending,
    error,
    subject: data && data.subject,
    html: data && data.html,
  }
}

const mapDispatchToProps = {
  onPreviewRequested: getPreview,
}

export default connect(mapStateToProps, mapDispatchToProps)(EmailPreview)
