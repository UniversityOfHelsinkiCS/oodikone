import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

export const DividerWithText = ({ text }: { text: string }) => (
  <Divider sx={{ my: '1em', width: '100%' }}>
    <Typography fontSize="1.2em" variant="overline">
      {text}
    </Typography>
  </Divider>
)
