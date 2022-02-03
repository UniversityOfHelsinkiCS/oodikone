import React from 'react'
import ReactMarkdown from 'react-markdown'

import { Popup, Button, Icon } from 'semantic-ui-react'

import infotooltips from '../../../common/InfoToolTips'

export default ({ tab, viewMode }) => {
  let content = infotooltips.CourseStatistics[tab]

  if (viewMode) {
    content = content[viewMode]
  }

  content = content.replace(/\n +/g, '\n')

  return (
    <Popup
      on="click"
      wide="very"
      trigger={
        <Button icon labelPosition="left">
          <Icon name="question circle outline" />
          Help
        </Button>
      }
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </Popup>
  )
}
