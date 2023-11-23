import React, { useState } from 'react'
import { Button, Modal, Message } from 'semantic-ui-react'

import { useGetUserAccessEmailPreviewQuery, useSendUserAccessEmailMutation } from 'redux/users'
import { EmailPreview } from './EmailPreview'

const SendEmailButton = props => <Button basic fluid positive content="Preview email ..." {...props} />

const DisabledEmailButton = props => (
  <Button basic fluid disabled content="Cannot send email - user has no email address" {...props} />
)

const SendFailBanner = ({ userEmail }) => <Message error header={`Email could not be sent to ${userEmail}`} />

export const EmailNotification = ({ userEmail }) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendEmail, { isLoading: sendIsLoading, isError: sendIsError }] = useSendUserAccessEmailMutation()
  const { data: email, isLoading: previewIsLoading, isError: previewIsError } = useGetUserAccessEmailPreviewQuery()

  return userEmail ? (
    <>
      <SendEmailButton onClick={() => setConfirmOpen(true)} />
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <Modal.Header>Send email about receiving access to Oodikone</Modal.Header>
        <Modal.Content scrolling>
          <Modal.Description>
            {sendIsError && <SendFailBanner userEmail={userEmail} />}
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
            onClick={() => sendEmail(userEmail)}
            disabled={previewIsLoading || previewIsError || sendIsLoading}
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
