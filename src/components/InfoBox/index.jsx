import React from 'react'
import { Icon, Popup } from 'semantic-ui-react'
import { string } from 'prop-types'
import ReactMarkdown from 'react-markdown'

const InfoBox = ({ content }) => (
  <Popup
    trigger={<Icon style={{ float: 'right' }} name="info" />}
    wide="very"
  >
    <Popup.Content>
      <ReactMarkdown source={content} escapeHtml={false} />
    </Popup.Content>
  </Popup>
)

InfoBox.propTypes = {
  content: string.isRequired
}

export default InfoBox
