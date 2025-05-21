import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

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
