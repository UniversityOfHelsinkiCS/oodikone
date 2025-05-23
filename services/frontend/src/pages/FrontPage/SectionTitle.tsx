import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export const SectionTitle = ({ title }: { title: string }) => {
  return (
    <Box textAlign="center">
      <Typography component="h3" variant="h5">
        {title}
      </Typography>
    </Box>
  )
}
