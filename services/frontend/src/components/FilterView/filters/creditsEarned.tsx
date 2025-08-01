import { max, min } from 'lodash'
import { useMemo } from 'react'

import { getStudentTotalCredits } from '@/common'
import { useDebounce } from '@/hooks/debounce'
import { FilterTrayProps } from '../FilterTray'
import { FilterRange } from './common/FilterRange'
import { createFilter } from './createFilter'

const CreditsEarnedFilterCard = ({ options, onOptionsChange, precomputed: bounds }: FilterTrayProps) => {
  const { min, max } = bounds

  const onChange = ([min, max]) => {
    onOptionsChange({ min, max })
  }

  const intMin = Math.floor(min)
  const intMax = Math.ceil(max)

  const value: [number, number] = useMemo(
    () => [options.min ?? intMin, options.max ?? intMax],
    [options.min, options.max, intMin, intMax]
  )

  const [range, setRange] = useDebounce(value, onChange)

  return (
    <FilterRange
      max={max}
      min={min}
      range={range}
      setRange={setRange}
      text="Valitse opintopistehaitari, jolle asettuvat opiskelijat näytetään"
    />
  )
}

export const creditsEarnedFilter = createFilter({
  key: 'creditsEarnedFilter',

  title: 'Credits earned',

  defaultOptions: {
    min: null,
    max: null,
  },

  isActive: ({ min, max }) => min !== null || max !== null,

  precompute: ({ students }) => {
    const credits = students.map(student => getStudentTotalCredits(student)).filter(n => !Number.isNaN(n))

    return {
      max: max(credits),
      min: min(credits),
    }
  },

  filter(student, { options }) {
    const { min, max } = options
    const credits = getStudentTotalCredits(student)

    return !(min !== null && credits < min) && !(max !== null && credits > max)
  },

  render: CreditsEarnedFilterCard,
})
