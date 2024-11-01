import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, Icon, Message, Popup } from 'semantic-ui-react'

import { formatContent } from '@/common'
import { InfoBoxButton } from './InfoBoxButton'
import './infoBox.css'

interface InfoBoxProps {
  content: string
  cypress?: string
  popup?: boolean
}

export const InfoBox = ({ content, cypress = '', popup = false }: InfoBoxProps) => {
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
            <ReactMarkdown>{formatContent(content)}</ReactMarkdown>
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
