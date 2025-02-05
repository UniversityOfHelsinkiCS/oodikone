import { Box, FormControlLabel, Paper } from '@mui/material'
import { ReactElement } from 'react'

export const Setting = ({ control, labelText }: { control: ReactElement; labelText: string }) => {
  return (
    <Box alignItems="center" display="flex">
      <Paper sx={{ display: 'flex', height: 60, padding: 1 }} variant="outlined">
        <FormControlLabel control={control} label={labelText} labelPlacement="start" />
      </Paper>
    </Box>
  )
}
