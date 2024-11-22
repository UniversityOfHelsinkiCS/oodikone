import { Box, Typography } from '@mui/material'

export const SectionTitle = ({ title }: { title: string }) => {
  return (
    <Box textAlign="center">
      <Typography component="h3" variant="h5">
        {title}
      </Typography>
    </Box>
  )
}
