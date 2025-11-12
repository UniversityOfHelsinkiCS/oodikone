import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

/**
 * @param numerator - goes up
 * @param denominator - goes down
 */
export const PercentageBar = ({ numerator, denominator }: { numerator: number; denominator: number }) => {
  const value = (numerator / denominator) * 100
  return (
    <Box alignItems="center" display="flex">
      <Box mr={1} width="100%">
        <LinearProgress
          color="primary"
          sx={{ height: '1.6em', borderRadius: '3px' }}
          value={value}
          variant="determinate"
        />
      </Box>
      <Box minWidth={35}>
        <Typography color="text.secondary" variant="body2">{`${value.toFixed(1)}%`}</Typography>
      </Box>
    </Box>
  )
}
