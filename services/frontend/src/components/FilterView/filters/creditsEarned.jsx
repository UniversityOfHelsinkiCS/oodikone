import _ from 'lodash'
import React, { useMemo } from 'react'

import { getStudentTotalCredits } from '@/common'
import { useDebounce } from '@/common/hooks'
import { RangeSelector } from '@/components/common/RangeSelector'
import { createFilter } from './createFilter'

const CreditsEarnedFilterCard = ({ options, onOptionsChange, bounds }) => {
  const { min, max } = bounds

  const onChange = ([min, max]) => {
    onOptionsChange({ min, max })
  }

  const value = useMemo(() => [options.min ?? min, options.max ?? max], [options.min, options.max, min, max])

  const [range, setRange] = useDebounce(value, 1000, onChange)

  return (
    <div>
      <p>Valitse opintopistehaitari, jolle asettuvat opiskelijat näytetään:</p>
      <div className="card-content">
        {min < max && <RangeSelector max={max} min={min} onChange={setRange} value={range} />}
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
    const credits = students.map(getStudentTotalCredits).filter(n => !Number.isNaN(n))

    return {
      max: _.max(credits),
      min: _.min(credits),
    }
  },

  filter(student, { min, max }) {
    const { credits } = student

    if (min !== null && credits < min) {
      return false
    }

    if (max !== null && credits > max) {
      return false
    }

    return true
  },

  render: (props, { precomputed }) => <CreditsEarnedFilterCard {...props} bounds={precomputed} />,
})
