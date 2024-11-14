import { Stack, Typography } from '@mui/material'

/**
 * A title text displayed at the top of the page.
 *
 * @param {string} [subtitle] - The subtitle of the page.
 * @param {string} title - The main title of the page.
 */
export const PageTitle = ({ subtitle, title }: { subtitle?: string; title: string }) => {
  return (
    <Stack sx={{ gap: 1, my: 3, textAlign: 'center' }}>
      <Typography component="h1" variant="h4">
        {title}
      </Typography>
      {subtitle && (
        <Typography color="textSecondary" component="h2" variant="h5">
          {subtitle}
        </Typography>
      )}
    </Stack>
  )
}
