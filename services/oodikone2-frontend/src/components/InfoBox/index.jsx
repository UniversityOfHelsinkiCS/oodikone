import React from 'react'
import { Icon, Popup } from 'semantic-ui-react'
import { string } from 'prop-types'
import ReactMarkdown from 'react-markdown'

const InfoBox = ({ content }) => (
  <Popup trigger={<Icon name="info" style={{ float: 'right' }} />} wide="very" position="left center" size="small">
    <Popup.Content>
      <ReactMarkdown source={content} escapeHtml={false} />
    </Popup.Content>
  </Popup>
)

InfoBox.propTypes = {
  content: string.isRequired
}

export default InfoBox
