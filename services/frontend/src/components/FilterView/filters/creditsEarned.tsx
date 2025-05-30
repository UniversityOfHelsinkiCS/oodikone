import { max, min } from 'lodash'
import { useMemo } from 'react'

import { getStudentTotalCredits } from '@/common'
import { RangeSelector } from '@/components/common/RangeSelector'
import { useDebounce } from '@/hooks/debounce'
import { createFilter } from './createFilter'

const CreditsEarnedFilterCard = ({ options, onOptionsChange, bounds }) => {
  const { min, max } = bounds

  const onChange = ([min, max]) => {
    onOptionsChange({ min, max })
  }

  const intMin = Math.floor(min)
  const intMax = Math.ceil(max)

  const value = useMemo(
    () => [options.min ?? intMin, options.max ?? intMax],
    [options.min, options.max, intMin, intMax]
  )

  const [range, setRange] = useDebounce(value, 1000, onChange)

  return (
    <div>
      <p>Valitse opintopistehaitari, jolle asettuvat opiskelijat näytetään:</p>
      <div className="card-content">
        {min < max && <RangeSelector max={intMax} min={intMin} onChange={setRange} value={range} />}
      </div>
    </div>
  )
}

export const creditsEarnedFilter = createFilter({
  key: 'CreditsEarned',

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

  filter({ credits }, { min, max }) {
    return !(min !== null && credits < min) && !(max !== null && credits > max)
  },

  render: (props, { precomputed }) => <CreditsEarnedFilterCard {...props} bounds={precomputed} />,
})
