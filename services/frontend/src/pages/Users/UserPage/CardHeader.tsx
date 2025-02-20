import { CardContent, Divider, Stack, Typography } from '@mui/material'

export const CardHeader = ({ buttons, title }: { buttons?: JSX.Element; title: string }) => {
  return (
    <>
      <CardContent sx={{ alignContent: 'center', height: 65 }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            {title}
          </Typography>
          <Stack direction="row" gap={1}>
            {buttons}
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
    </>
  )
}
