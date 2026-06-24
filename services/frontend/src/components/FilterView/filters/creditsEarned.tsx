import { max, min } from 'lodash-es'
import { useMemo } from 'react'

import { getStudentTotalCredits } from '@/common'
import { FilterRange } from '@/components/FilterView/filters/common/FilterRange'
import { createFilter, FilterTrayProps } from '@/components/FilterView/filters/createFilter'
import { useDebounce } from '@/hooks/debounce'

type Options = { min: number | null; max: number | null }
type Args = undefined
type Precompute = { min: number | undefined; max: number | undefined }

const CreditsEarnedFilterCard = ({
  options,
  onOptionsChange,
  precomputed: bounds,
}: FilterTrayProps<Options, Args, Precompute>) => {
  const { min, max } = bounds

  const onChange = ([min, max]) => {
    onOptionsChange({ min, max })
  }

  const intMin = Math.floor(min ?? 0)
  const intMax = Math.ceil(max ?? 0)

  const value: [number, number] = useMemo(
    () => [options.min ?? intMin, options.max ?? intMax],
    [options.min, options.max, intMin, intMax]
  )

  const [range, setRange] = useDebounce(value, onChange)

  return (
    <FilterRange
      max={intMax}
      min={intMin}
      range={range}
      setRange={setRange}
      text="Valitse opintopistehaitari, jolle asettuvat opiskelijat näytetään"
    />
  )
}

export const creditsEarnedFilter = createFilter<Options, Args, Precompute>({
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
