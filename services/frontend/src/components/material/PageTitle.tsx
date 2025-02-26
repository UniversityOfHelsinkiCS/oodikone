import { Box, Skeleton, Stack, Typography } from '@mui/material'

/**
 * A title text displayed at the top of the page.
 *
 * @param {string} [subtitle] - The subtitle of the page.
 * @param {string} [title] - The main title of the page.
 */
export const PageTitle = ({ subtitle, title }: { subtitle?: string; title?: string | null }) => {
  return (
    <Stack sx={{ gap: 1, my: 3, textAlign: 'center' }}>
      {title ? (
        <Box height={40}>
          <Typography component="h1" variant="h4">
            {title}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            height: 40,
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Skeleton height="100%" variant="text" width="60%" />
        </Box>
      )}
      {subtitle && (
        <Typography color="text.secondary" component="h2" variant="h6">
          {subtitle}
        </Typography>
      )}
    </Stack>
  )
}
