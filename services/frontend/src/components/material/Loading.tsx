import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper, { PaperProps } from '@mui/material/Paper'

export const Loading = () => {
  return (
    <Box display="flex" justifyContent="center" width="100%">
      <CircularProgress />
    </Box>
  )
}

export const LoadingSection = ({ ...sectionProps }: PaperProps) => {
  return (
    <Paper variant="outlined" {...sectionProps}>
      <Loading />
    </Paper>
  )
}
