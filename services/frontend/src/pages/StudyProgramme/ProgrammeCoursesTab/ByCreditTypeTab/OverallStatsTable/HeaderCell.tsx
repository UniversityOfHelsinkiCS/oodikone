import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

export const HeaderCell = ({ value }: { value: string }) => {
  return (
    <Box sx={{ textAlign: 'left' }}>
      <Stack>
        {value.split(' ').map(subString => (
          <span key={subString}>{subString}</span>
        ))}
      </Stack>
    </Box>
  )
}
