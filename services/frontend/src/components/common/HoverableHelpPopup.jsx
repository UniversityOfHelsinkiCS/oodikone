import React from 'react'
import { Popup, Icon } from 'semantic-ui-react'

export const HoverableHelpPopup = ({ content, style, size = 'small' }) => (
  <Popup hoverable content={content} size={size} trigger={<Icon name="question circle outline" style={style} />} />
)
