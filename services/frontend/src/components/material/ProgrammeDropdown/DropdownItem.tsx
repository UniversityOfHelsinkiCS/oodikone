import { Person as PersonIcon } from '@mui/icons-material'
import { Box, Chip, Typography } from '@mui/material'

export const DropdownItem = ({
  code,
  description,
  name,
  size,
}: {
  code: string
  description: string
  name: string
  size: number
}) => (
  <Box alignItems="center" display="flex" justifyContent="space-between" width="100%">
    <Box alignItems="center" display="flex">
      <Chip icon={<PersonIcon />} label={size} size="small" sx={{ marginRight: 1 }} />
      <Typography component="span" variant="body2">
        {name}
      </Typography>
      {['ALL', 'OTHER', 'EXCLUDED'].includes(code) && (
        <Typography color="text.secondary" component="span" sx={{ marginLeft: 0.5 }} variant="body2">
          ({description})
        </Typography>
      )}
    </Box>
    <Typography color="text.secondary" variant="caption">
      {code}
    </Typography>
  </Box>
)
