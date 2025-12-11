import Button from '@mui/material/Button'

export const FetchStatisticsButton = ({
  disabled,
  onClick,
  selectedCourses,
}: {
  disabled: boolean
  onClick: () => void
  selectedCourses: number
}) => {
  if (selectedCourses === 0) return null

  return (
    <Button data-cy="fetch-stats-button" disabled={disabled} fullWidth onClick={onClick} variant="contained">
      Fetch statistics
    </Button>
  )
}
