import React, { useState } from 'react'
import { Button, Modal, Message } from 'semantic-ui-react'

import { useGetUserAccessEmailPreviewQuery, useSendUserAccessEmailMutation } from 'redux/users'
import { EmailPreview } from './EmailPreview'

const SendEmailButton = props => <Button basic content="Preview email ..." fluid positive {...props} />

const DisabledEmailButton = props => (
  <Button basic content="Cannot send email - user has no email address" disabled fluid {...props} />
)

const SendFailBanner = ({ userEmail }) => <Message error header={`Email could not be sent to ${userEmail}`} />
const SendSuccessBanner = ({ userEmail }) => <Message header={`Email sent to ${userEmail}`} success />

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
      <Modal onClose={() => setConfirmOpen(false)} open={confirmOpen}>
        <Modal.Header>Send email about receiving access to Oodikone</Modal.Header>
        <Modal.Content scrolling>
          <Modal.Description>
            {getNotification()}
            <EmailPreview
              email={email}
              isError={previewIsError}
              isLoading={previewIsLoading}
              userEmailAddress={userEmail}
            />
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button
            content="Cancel"
            disabled={previewIsLoading || previewIsError || sendIsLoading}
            onClick={() => setConfirmOpen(false)}
          />
          <Button
            content="Send"
            disabled={previewIsLoading || previewIsError || sendIsLoading || sendIsSuccess}
            icon="send"
            loading={sendIsLoading}
            onClick={() => {
              sendEmail(userEmail)
            }}
            primary
          />
        </Modal.Actions>
      </Modal>
    </>
  ) : (
    <DisabledEmailButton />
  )
}
