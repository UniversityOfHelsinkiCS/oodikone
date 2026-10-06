import { SearchIcon, theme } from '@/theme'
import TextField from '@mui/material/TextField'
import { useState } from 'react'

export const NameSearch = ({ setFilter }: { setFilter: React.Dispatch<React.SetStateAction<string>> }) => {
  const [textField, setTextField] = useState('')

  return (
    <TextField
      label="Search by name or username"
      onChange={event => {
        setTextField(event.target.value)
        setFilter(event.target.value)
      }}
      size="small"
      slotProps={{
        input: { endAdornment: <SearchIcon fontSize="small" htmlColor={theme.palette.grey[700]} sx={{ ml: 2 }} /> },
      }}
      value={textField}
    />
  )
}
