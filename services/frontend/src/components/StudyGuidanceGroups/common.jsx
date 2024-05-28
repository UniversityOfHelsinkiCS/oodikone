import { Message, Segment } from 'semantic-ui-react'

export const startYearToAcademicYear = year => {
  return year === '' || Number.isNaN(year) ? '' : `${year} - ${parseInt(year, 10) + 1}`
}

export const StyledMessage = ({ children, style }) => (
  <Message style={{ margin: 'auto', maxWidth: '800px', ...style }}>{children}</Message>
)

export const Wrapper = ({ isLoading, children }) => (
  <div className="segmentContainer">
    <Segment className="contentSegment" loading={isLoading}>
      {children}
    </Segment>
  </div>
)
