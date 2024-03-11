import React from 'react'
import { Message, Segment } from 'semantic-ui-react'

export const startYearToAcademicYear = year => {
  return year === '' || Number.isNaN(year) ? '' : `${year} - ${parseInt(year, 10) + 1}`
}

export const StyledMessage = ({ children }) => (
  <Message style={{ maxWidth: '800px', margin: 'auto' }}>{children}</Message>
)

export const Wrapper = ({ isLoading, children }) => (
  <div className="segmentContainer">
    <Segment className="contentSegment" loading={isLoading}>
      {children}
    </Segment>
  </div>
)
