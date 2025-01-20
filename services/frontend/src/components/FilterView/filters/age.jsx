import { useCallback, useMemo } from 'react'

import { RangeSelector } from '@/components/common/RangeSelector'
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
    <div>
      <p>Valitse ikähaitari, jolle asettuvat opiskelijat näytetään:</p>
      <div className="card-content">
        {min < max && <RangeSelector max={max} min={min} onChange={setRange} value={range} />}
      </div>
    </div>
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
      min: ages.length > 0 ? Math.min(...ages) : undefined,
      max: ages.length > 0 ? Math.max(...ages) : undefined,
    }
  },

  filter: (student, { min, max }) => {
    const age = getAge(student.birthdate)

    if (min !== null && min > age) {
      return false
    }

    if (max !== null && max < age) {
      return false
    }

    return true
  },

  render: (props, { precomputed }) => <AgeFilterCard {...props} bounds={precomputed} />,
})
