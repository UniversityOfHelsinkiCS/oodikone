import Paper from '@mui/material/Paper'
import { LoadingSection } from '@/components/material/Loading'

export const startYearToAcademicYear = year => {
  return year === '' || Number.isNaN(year) ? '' : `${year} - ${parseInt(year, 10) + 1}`
}

export const Wrapper = ({ isLoading, children }) => {
  const content = isLoading ? (
    <LoadingSection className="contentSegment" />
  ) : (
    <Paper className="contentSegment">{children}</Paper>
  )

  return <div className="segmentContainer">{content}</div>
}
