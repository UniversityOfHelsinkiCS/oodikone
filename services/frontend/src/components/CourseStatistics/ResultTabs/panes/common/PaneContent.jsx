import React from 'react'
import { Segment, Tab } from 'semantic-ui-react'

export const PaneContent = ({ children }) => {
  return (
    <Tab.Pane>
      <Segment basic>{children}</Segment>
    </Tab.Pane>
  )
}
