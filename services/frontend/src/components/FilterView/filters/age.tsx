import { useMemo } from 'react'

import { FilterRange } from '@/components/FilterView/filters/common/FilterRange'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'
import { useDebounce } from '@/hooks/debounce'
import { getAge } from '@/util/timeAndDate'

type Options = { min: number | null; max: number | null }
type Args = undefined
type Precompute = { min: number | null; max: number | null }

const AgeFilterCard = ({
  options,
  onOptionsChange,
  precomputed: bounds,
}: FilterTrayProps<Options, Args, Precompute>) => {
  const { min, max } = bounds

  const onChange = ([min, max]) => {
    onOptionsChange({ min, max })
  }

  const value: [number, number] = useMemo(
    () => [options.min ?? min ?? 0, options.max ?? max ?? 100],
    [options.min, options.max, min, max]
  )

  const [range, setRange] = useDebounce(value, onChange)

  return (
    <FilterRange
      max={max ?? 100}
      min={min ?? 0}
      range={range}
      setRange={setRange}
      text="Valitse ikähaitari, jolle asettuvat opiskelijat näytetään"
    />
  )
}

export const ageFilter = createFilter<Options, Args, Precompute>({
  key: 'ageFilter',

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
