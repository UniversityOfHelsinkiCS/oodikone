import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export const FeatureItem = ({ content, title }: { content: JSX.Element | string; title: string }) => {
  return (
    <Box>
      <Typography component="h4" variant="h6">
        {title}
      </Typography>
      <Typography component="div" variant="body1">
        {content}
      </Typography>
    </Box>
  )
}
