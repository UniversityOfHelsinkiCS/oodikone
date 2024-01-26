import React, { useState } from 'react'
import { Button, Modal, Message } from 'semantic-ui-react'

import { useGetUserAccessEmailPreviewQuery, useSendUserAccessEmailMutation } from 'redux/users'
import { EmailPreview } from './EmailPreview'

const SendEmailButton = props => <Button basic fluid positive content="Preview email ..." {...props} />

const DisabledEmailButton = props => (
  <Button basic fluid disabled content="Cannot send email - user has no email address" {...props} />
)

const SendFailBanner = ({ userEmail }) => <Message error header={`Email could not be sent to ${userEmail}`} />
const SendSuccessBanner = ({ userEmail }) => <Message success header={`Email sent to ${userEmail}`} />

export const EmailNotification = ({ userEmail }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendEmail, { isLoading: sendIsLoading, isError: sendIsError, isSuccess: sendIsSuccess }] =
    useSendUserAccessEmailMutation()
  const { data: email, isLoading: previewIsLoading, isError: previewIsError } = useGetUserAccessEmailPreviewQuery()

  const getNotification = () => {
    if (sendIsSuccess) {
      return <SendSuccessBanner userEmail={userEmail} />
    }
    if (sendIsError) {
      return <SendFailBanner userEmail={userEmail} />
    }
    return null
  }

  return userEmail ? (
    <>
      <SendEmailButton onClick={() => setConfirmOpen(true)} />
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <Modal.Header>Send email about receiving access to Oodikone</Modal.Header>
        <Modal.Content scrolling>
          <Modal.Description>
            {getNotification()}
            <EmailPreview
              userEmailAddress={userEmail}
              email={email}
              isLoading={previewIsLoading}
              isError={previewIsError}
            />
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button
            disabled={previewIsLoading || previewIsError || sendIsLoading}
            onClick={() => setConfirmOpen(false)}
            content="Cancel"
          />
          <Button
            primary
            onClick={() => {
              sendEmail(userEmail)
            }}
            disabled={previewIsLoading || previewIsError || sendIsLoading || sendIsSuccess}
            loading={sendIsLoading}
            icon="send"
            content="Send"
          />
        </Modal.Actions>
      </Modal>
    </>
  ) : (
    <DisabledEmailButton />
  )
}
