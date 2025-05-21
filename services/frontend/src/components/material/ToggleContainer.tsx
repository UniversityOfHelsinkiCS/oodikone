import Stack from '@mui/material/Stack'

export const ToggleContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Stack alignItems="center" direction="column" gap={1}>
      {children}
    </Stack>
  )
}
