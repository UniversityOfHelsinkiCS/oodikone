import ReactMarkdown from 'react-markdown'
import { Icon, Popup } from 'semantic-ui-react'

import { formatContent } from '@/common'

interface HoverableHelpPopupProps {
  content: string
  size?: 'mini' | 'tiny' | 'small' | 'large' | 'huge'
  style?: React.CSSProperties
}

export const HoverableHelpPopup = ({ content, size = 'small', style }: HoverableHelpPopupProps) => (
  <Popup
    content={<ReactMarkdown>{formatContent(content)}</ReactMarkdown>}
    hoverable
    position="top center"
    size={size}
    trigger={<Icon name="question circle outline" style={style} />}
  />
)
