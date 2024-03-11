import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, Icon, Message, Popup } from 'semantic-ui-react'
import { InfoBoxButton } from './InfoBoxButton'
import './infoBox.css'

/**
 * Removes leading spaces so that the content can be properly formatted with Markdown.
 *
 * @param {string} content - The content to display in the InfoBox.
 * @returns {string} The content with leading spaces removed.
 */
const formatContent = content => content.replace(/\n +/g, '\n')

/**
 * A toggleable component for displaying information on how to use a feature or how to interpret data.
 * The InfoBox can be displayed as a popup or as a message box. The default is a message box.
 *
 * @param {string} content - The content to display in the InfoBox. Supports Markdown for formatting.
 * @param {string} [cypress] - A unique, descriptive tag to use for end-to-end testing with Cypress.
 * @param {boolean} [popup] - If true, the InfoBox will be displayed as a popup. False by default.
 */
export const InfoBox = ({ content, cypress, popup = false }) => {
  const [open, setOpen] = useState(false)
  const toggleOpen = () => setOpen(prev => !prev)

  if (popup) {
    return (
      <Popup
        on="click"
        trigger={
          <div>
            <InfoBoxButton />
          </div>
        }
        wide="very"
      >
        <ReactMarkdown>{formatContent(content)}</ReactMarkdown>
      </Popup>
    )
  }

  if (open) {
    return (
      <Message className="ok-infobox" color="green" icon>
        <div className="content-container" data-cy={`${cypress}-info-content`}>
          <Icon name="info circle" size="huge" />
          <Message.Content className="ok-infobox content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </Message.Content>
        </div>
        <Button className="ok-infobox-close" data-cy={`${cypress}-close-info`} onClick={toggleOpen}>
          Close Info
        </Button>
      </Message>
    )
  }

  return <InfoBoxButton cypress={cypress} toggleOpen={toggleOpen} />
}
