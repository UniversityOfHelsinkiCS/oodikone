import { Typography } from '@mui/material'

export const ObfuscatedCell = ({ na = false }: { na?: boolean }) => {
  return (
    <Typography color="text.secondary" component="span" variant="body2">
      {na ? 'NA' : '5 or fewer students'}
    </Typography>
  )
}
