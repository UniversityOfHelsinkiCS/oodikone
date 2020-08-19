import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Message, Icon, Button } from 'semantic-ui-react'
import './infoBox.css'

const NewInfoBox = ({ content }) => {
  const [open, setOpen] = useState(false)
  const toggleOpen = () => setOpen(prev => !prev)

  return open ? (
    <Message icon className="ok-infobox" color="green">
      <Icon name="info circle" />
      <Message.Content>
        <Message.Header>Infobox</Message.Header>
        {content}
        <Button onClick={toggleOpen} className="ok-infobox-close" basic color="green">
          Close Info
        </Button>
      </Message.Content>
    </Message>
  ) : (
    <Button icon labelPosition="left" className="ok-infobox-collapsed" onClick={toggleOpen} basic color="green">
      <Icon name="info circle" />
      Show Info
    </Button>
  )
}

NewInfoBox.propTypes = {
  content: PropTypes.node.isRequired
}

export default NewInfoBox
