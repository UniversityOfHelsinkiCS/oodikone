import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Message, Icon, Button } from 'semantic-ui-react'
import ReactMarkdown from 'react-markdown'
import './infoBox.css'

export const InfoBox = ({ content, cypress }) => {
  const [open, setOpen] = useState(false)
  const toggleOpen = () => setOpen(prev => !prev)

  return open ? (
    <Message icon className="ok-infobox" color="green">
      <div className="content-container" data-cy={`${cypress}-info-content`}>
        <Icon name="info circle" size="huge" />
        <Message.Content className="ok-infobox content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </Message.Content>
      </div>
      <Button onClick={toggleOpen} className="ok-infobox-close" data-cy={`${cypress}-close-info`}>
        Close Info
      </Button>
    </Message>
  ) : (
    <Button
      icon
      labelPosition="left"
      className="ok-infobox-collapsed"
      onClick={toggleOpen}
      basic
      color="green"
      data-cy={`${cypress}-open-info`}
    >
      <Icon name="info circle" />
      Show Info
    </Button>
  )
}

InfoBox.propTypes = {
  content: PropTypes.node.isRequired,
}
