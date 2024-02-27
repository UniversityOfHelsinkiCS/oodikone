import _ from 'lodash'
import React, { useMemo } from 'react'
import { Icon } from 'semantic-ui-react'
import { useContextSelector } from 'use-context-selector'

import { useDebounce } from '@/common/hooks'
import { RangeSelector } from '@/components/common/RangeSelector'
import { SortableTableContext, getColumnValue } from '../common'

const RangeColumnFilterComponent = ({ column, options, dispatch }) => {
  const values = useContextSelector(SortableTableContext, ctx => ctx.values[column.key]) ?? []

  const min = _.min(values.filter(_.isNumber)) ?? 0
  const max = _.max(values.filter(_.isNumber)) ?? 0

  const value = useMemo(() => {
    if (options.range) {
      return [_.clamp(options.range[0], min, max), _.clamp(options.range[1], min, max)]
    }

    return [min, max]
  }, [options.range, min, max])

  const onChange = range =>
    dispatch({
      type: 'SET_RANGE',
      payload: { range },
    })

  const [range, setRange, , dirty] = useDebounce(value, 100, onChange)

  const handleChange = ([newMin, newMax]) => {
    if (newMin === min && newMax === max) {
      dispatch({
        type: 'RESET',
      })
    } else {
      setRange([
        typeof newMin === 'number' && !Number.isNaN(newMin) ? newMin : min,
        typeof newMax === 'number' && !Number.isNaN(newMax) ? newMax : max,
      ])
    }
  }

  return (
    <div
      style={{ padding: '0.4em 0.75em', marginBottom: '0.5em' }}
      onClick={evt => evt.stopPropagation()}
      onMouseDown={evt => evt.stopPropagation()}
      onMouseUp={evt => evt.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: 'black', fontWeight: 'normal', margin: '0.3em 0 0.5em 0', flex: 1 }}>
          Select value range:
        </div>
        {dirty && <Icon loading name="spinner" />}
      </div>
      <RangeSelector min={min} max={max} onChange={handleChange} value={range} />
    </div>
  )
}

export const rangeColumnFilter = {
  component: RangeColumnFilterComponent,

  initialOptions: () => ({
    range: undefined,
  }),

  reduce: (options, { type, payload }) => {
    if (type === 'SET_RANGE') {
      options.range = payload.range
    } else if (type === 'RESET') {
      options.range = undefined
    }
  },

  isActive: options => options.range !== undefined,

  filter: (ctx, column, options) => {
    if (!options.range) {
      return true
    }

    const [low, high] = options.range
    const value = getColumnValue(ctx, column)

    return low <= value && value <= high
  },
}
