import { Box, Typography } from '@mui/material'

/**
 * A title text displayed at the top of the page.
 *
 * @param {string} title - The main title of the page.
 */
export const PageTitle = ({ title }: { title: string }) => {
  return (
    <Box my={3}>
      <Typography component="h1" variant="h4">
        {title}
      </Typography>
    </Box>
  )
}
