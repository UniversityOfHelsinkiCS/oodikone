import { Box, Stack } from '@mui/material'

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
