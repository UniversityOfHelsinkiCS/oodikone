import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, Icon, Popup } from 'semantic-ui-react'
import { courseStatisticsToolTips } from 'common/InfoToolTips'

export const HelpButton = ({ tab, viewMode }) => {
  let content = courseStatisticsToolTips[tab]

  if (viewMode) {
    content = content[viewMode]
  }

  content = content.replace(/\n +/g, '\n')

  return (
    <Popup
      on="click"
      wide="very"
      trigger={
        <Button icon labelPosition="left" style={{ height: '50px', marginLeft: '30px' }}>
          <Icon name="question circle outline" />
          Help
        </Button>
      }
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </Popup>
  )
}
