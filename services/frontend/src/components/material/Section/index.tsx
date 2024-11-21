import { Box, Paper, Stack, Typography } from '@mui/material'

import { InfoBox } from '@/components/material/InfoBox'

export const Section = ({
  children,
  cypress,
  title,
  infoBoxContent,
}: {
  children: React.ReactNode
  cypress?: string
  title: string
  infoBoxContent?: string
}) => {
  return (
    <Paper sx={{ marginBottom: 2, padding: 2 }} variant="outlined">
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
        {infoBoxContent && <InfoBox content={infoBoxContent} cypress={cypress} />}
      </Stack>
      <Box sx={{ marginTop: 2 }}>{children}</Box>
    </Paper>
  )
}
