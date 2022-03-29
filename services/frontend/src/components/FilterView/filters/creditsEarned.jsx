import RangeSelector from 'components/RangeSelector'
import React, { useMemo } from 'react'
import _ from 'lodash'
import { useDebounce } from 'common/hooks'
import { getStudentTotalCredits } from '../../../common'
import createFilter from './createFilter'

export const contextKey = 'creditFilter'

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
        {min < max && <RangeSelector min={min} max={max} onChange={setRange} value={range} />}
      </div>
    </div>
  )
}

export default createFilter({
  key: 'CreditsEarned',

  title: 'Credits Earned',

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
    const credits = getStudentTotalCredits(student)

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
