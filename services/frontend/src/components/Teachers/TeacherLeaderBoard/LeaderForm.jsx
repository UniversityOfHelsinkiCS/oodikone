import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import { any, arrayOf, func, number, shape, string } from 'prop-types'
import { useEffect } from 'react'

const currentYear = () => {
  const now = new Date()
  const year = now.getFullYear()

  return now.getMonth() > 7 ? year : year - 1
}

export const LeaderForm = ({
  selectedyear,
  selectedcategory,
  handleCategoryChange,
  handleYearChange,
  yearoptions,
  categoryoptions,
  initLeaderboard,
}) => {
  useEffect(() => {
    const year = yearoptions.find(year => Number(year.text.slice(0, 4)) === currentYear())?.value
    const category = categoryoptions.at(0)?.value

    if (!!year && !!category) initLeaderboard(year, category)
  }, [])

  return (
    <Paper sx={{ padding: 2 }} variant="outlined">
      <Stack flexDirection="row" gap={1}>
        <FormControl fullWidth size="small">
          <InputLabel>Academic year</InputLabel>
          <Select label="academic-year-label" onChange={handleYearChange} value={selectedyear ?? ''} variant="outlined">
            {yearoptions.map(option => (
              <MenuItem key={option.key} value={option.value}>
                {option.text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Category</InputLabel>
          <Select
            label="category-label"
            onSelect={handleCategoryChange}
            value={selectedcategory ?? ''}
            variant="outlined"
          >
            {categoryoptions.map(option => (
              <MenuItem key={option.key} value={option.value}>
                {option.text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Paper>
  )
}

LeaderForm.propTypes = {
  yearoptions: arrayOf(shape({})).isRequired,
  categoryoptions: arrayOf(shape({ key: any, value: any, text: string })).isRequired,
  initLeaderboard: func.isRequired,
  handleCategoryChange: func.isRequired,
  handleYearChange: func.isRequired,
  selectedcategory: string,
  selectedyear: number,
}
