import _ from 'lodash'
import React, { useMemo, useCallback } from 'react'

import { useDebounce } from '@/common/hooks'
import { RangeSelector } from '@/components/common/RangeSelector'
import { createFilter } from './createFilter'

const getAge = toDate => {
  const today = new Date()
  const birthDate = new Date(toDate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

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
        {min < max && <RangeSelector min={min} max={max} onChange={setRange} value={range} />}
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
    const ages = students.map(s => getAge(s.birthdate)).filter(age => !Number.isNaN(age))

    return {
      min: _.min(ages),
      max: _.max(ages),
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
