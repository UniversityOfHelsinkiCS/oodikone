import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type FilterRangeProps = {
  text: string
  min: number
  max: number
  range: [number, number]
  setRange: (value: any) => void
}

export const FilterRange = ({ text, min, max, range, setRange }: FilterRangeProps) => (
  <Stack spacing={2}>
    <Typography>{text}</Typography>
    <Slider
      max={max}
      min={min}
      onChange={(_, newValue) => setRange(newValue)}
      sx={{ width: '90%', alignSelf: 'center' }}
      value={range}
      valueLabelDisplay="auto"
    />
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', maxWidth: '90%', alignSelf: 'center' }}>
      <TextField
        data-cy="FilterRangeStart"
        onChange={({ target }) => setRange([target.value === '' || +target.value, range[1]])}
        size="small"
        type="number"
        value={range[0]}
      />
      <Typography component="span" sx={{ alignContent: 'center' }} variant="h6">
        -
      </Typography>
      <TextField
        data-cy="FilterRangeEnd"
        onChange={({ target }) => setRange([range[0], target.value === '' || +target.value])}
        size="small"
        type="number"
        value={range[1]}
      />
    </Stack>
  </Stack>
)
