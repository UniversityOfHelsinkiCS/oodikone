import Typography from '@mui/material/Typography'

export const TotalsDisclaimer = ({
  shownAsZero = false,
  userHasAccessToAllStats,
}: {
  shownAsZero?: boolean
  userHasAccessToAllStats: boolean
}) => {
  if (userHasAccessToAllStats) {
    return null
  }

  return (
    <Typography color="text.secondary" component="span" variant="body2">
      * Years with 5 students or fewer are {shownAsZero ? 'shown as 0 in the chart' : 'NOT included in the total'}
    </Typography>
  )
}
