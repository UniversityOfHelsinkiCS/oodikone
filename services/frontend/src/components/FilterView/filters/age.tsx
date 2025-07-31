import { useCallback, useMemo } from 'react'

import { useDebounce } from '@/hooks/debounce'
import { getAge } from '@/util/timeAndDate'
import { FilterTrayProps } from '../FilterTray'
import { FilterRange } from './common/FilterRange'
import { createFilter } from './createFilter'

const AgeFilterCard = ({ options, onOptionsChange, precomputed: bounds }: FilterTrayProps) => {
  const { min, max } = bounds

  const onChange = useCallback(
    ([min, max]) => {
      onOptionsChange({ min, max })
    },
    [onOptionsChange]
  )

  const value: [number, number] = useMemo(
    () => [options.min ?? min, options.max ?? max],
    [options.min, options.max, min, max]
  )

  const [range, setRange] = useDebounce(value, onChange)

  return (
    <FilterRange
      max={max}
      min={min}
      range={range}
      setRange={setRange}
      text="Valitse ikähaitari, jolle asettuvat opiskelijat näytetään"
    />
  )
}

export const ageFilter = createFilter({
  key: 'Age',

  title: 'Age',

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

  render: AgeFilterCard,
})
