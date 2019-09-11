import React, { useEffect, Fragment } from 'react'
import { bool, func, string, node } from 'prop-types'
import { Label, Segment } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getPreview } from '../../redux/userAccessEmail'

const Light = ({ children }) => (
  <span style={{ fontWeight: 'normal' }}>{children}</span>
)

Light.propTypes = {
  children: node.isRequired
}

const EmailHeader = ({ isLoading, subject, to }) => {
  if (isLoading) {
    return (
      <Segment>
        <Label attached="top">Loading preview...</Label>
      </Segment>
    )
  }

  return (
    <Fragment>
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
    </Fragment>
  )
}

EmailHeader.defaultProps = {
  subject: undefined,
  to: undefined
}

EmailHeader.propTypes = {
  isLoading: bool.isRequired,
  subject: string,
  to: string
}

const EmailPreview = ({
  userEmail,
  isLoading,
  error,
  subject,
  html,
  onPreviewRequested
}) => {
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
        color={error ? 'red' : undefined}
        style={{ background: '#f7f7f7' }}
      >
        {!isLoading && (
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

EmailPreview.defaultProps = {
  subject: null,
  html: null,
  error: null
}

EmailPreview.propTypes = {
  onPreviewRequested: func.isRequired,
  isLoading: bool.isRequired,
  userEmail: string.isRequired,
  subject: string,
  html: string,
  error: string
}

const mapStateToProps = ({ userAccessEmail: { preview } }) => {
  const { pending, error, data } = preview
  return {
    isLoading: pending,
    error,
    subject: data && data.subject,
    html: data && data.html
  }
}

const mapDispatchToProps = {
  onPreviewRequested: getPreview
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EmailPreview)
