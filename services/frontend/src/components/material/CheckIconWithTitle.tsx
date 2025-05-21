import CheckIcon from '@mui/icons-material/Check'
import Box from '@mui/material/Box'

export const CheckIconWithTitle = ({ visible, title }: { visible: boolean; title?: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }} title={title}>
    {visible ? <CheckIcon color="success" fontSize="small" /> : <Box sx={{ width: '20px', height: '20px' }} />}
  </Box>
)
