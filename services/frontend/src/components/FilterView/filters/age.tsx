import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo } from 'react'

import { useDebounce } from '@/hooks/debounce'
import { getAge } from '@/util/timeAndDate'
import { createFilter } from './createFilter'

const AgeFilterCard = ({ options, onOptionsChange, bounds }) => {
  const { min, max } = bounds

  const onChange = useCallback(
    ([min, max]) => {
      onOptionsChange({ min, max })
    },
    [onOptionsChange]
  )

  const value = useMemo(() => [options.min ?? min, options.max ?? max], [options.min, options.max, min, max])

  const [range, setRange] = useDebounce(value, 1000, onChange)

  return (
    <Stack spacing={2} sx={{ mb: 3.5 }}>
      <Typography>Valitse ikähaitari, jolle asettuvat opiskelijat näytetään</Typography>
      <Slider
        marks={[
          { value: range[0], label: range[0] },
          { value: range[1], label: range[1] },
        ]}
        max={max}
        min={min}
        onChange={(_, newValue) => setRange(newValue)}
        sx={{ width: '90%', alignSelf: 'center' }}
        value={range}
        valueLabelDisplay="off"
      />
    </Stack>
  )
}

export const ageFilter = createFilter({
  key: 'Age',

  defaultOptions: {
    min: null,
    max: null,
  },

  isActive: ({ min, max }) => min !== null || max !== null,

  precompute: ({ students }) => {
    const ages = students.map(student => getAge(student.birthdate))

    return {
      min: ages.length ? Math.min(...ages) : null,
      max: ages.length ? Math.max(...ages) : null,
    }
  },

  filter: (student, { options }) => {
    const { min, max } = options
    const age = getAge(student.birthdate)

    return !(min !== null && min > age) && !(max !== null && max < age)
  },

  render: (props, { precomputed }) => <AgeFilterCard {...props} bounds={precomputed} />,
})
