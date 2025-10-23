import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import { LoadingSection } from '@/components/material/Loading'

export const startYearToAcademicYear = year => {
  return year === '' || Number.isNaN(year) ? '' : `${year} - ${parseInt(year, 10) + 1}`
}

export const StyledMessage = ({ children, style }) => (
  <Alert icon={false} severity="info" sx={{ margin: 'auto', maxWidth: '800px', ...style }} variant="outlined">
    {children}
  </Alert>
)

export const Wrapper = ({ isLoading, children }) => {
  const content = isLoading ? (
    <LoadingSection className="contentSegment" />
  ) : (
    <Paper className="contentSegment" loading={isLoading}>
      {children}
    </Paper>
  )

  return <div className="segmentContainer">{content}</div>
}
