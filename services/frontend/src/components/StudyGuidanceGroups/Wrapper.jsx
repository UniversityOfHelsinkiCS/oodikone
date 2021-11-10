import React from 'react'
import { Segment } from 'semantic-ui-react'

export default ({ isLoading, children }) => (
  <div className="segmentContainer">
    <Segment loading={isLoading} className="contentSegment">
      {children}
    </Segment>
  </div>
)
