import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Message, Icon, Button } from 'semantic-ui-react'
import ReactMarkdown from 'react-markdown'
import './infoBox.css'

const InfoBox = ({ content }) => {
  const [open, setOpen] = useState(false)
  const toggleOpen = () => setOpen(prev => !prev)

  return open ? (
    <Message icon className="ok-infobox" color="green">
      <div className="content-container">
        <Icon name="info circle" size="huge" />
        <Message.Content>
          <ReactMarkdown source={content} escapeHtml={false} />
        </Message.Content>
      </div>
      <Button onClick={toggleOpen} className="ok-infobox-close">
        Close Info
      </Button>
    </Message>
  ) : (
    <Button icon labelPosition="left" className="ok-infobox-collapsed" onClick={toggleOpen} basic color="green">
      <Icon name="info circle" />
      Show Info
    </Button>
  )
}

InfoBox.propTypes = {
  content: PropTypes.node.isRequired,
}

export default InfoBox
