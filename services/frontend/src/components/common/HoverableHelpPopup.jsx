import { Popup, Icon } from 'semantic-ui-react'

export const HoverableHelpPopup = ({ content, style, size = 'small' }) => (
  <Popup
    content={content}
    hoverable
    position="top center"
    size={size}
    trigger={<Icon name="question circle outline" style={style} />}
  />
)
