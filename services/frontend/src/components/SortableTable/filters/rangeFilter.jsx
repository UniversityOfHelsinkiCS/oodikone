import { clamp, isNumber, max, min } from 'lodash'
import { useMemo } from 'react'
import { Icon } from 'semantic-ui-react'
import { useContextSelector } from 'use-context-selector'

import { RangeSelector } from '@/components/common/RangeSelector'
import { SortableTableContext, getColumnValue } from '@/components/SortableTable/common'
import { useDebounce } from '@/hooks/debounce'

const RangeColumnFilterComponent = ({ column, options, dispatch }) => {
  const values = useContextSelector(SortableTableContext, ctx => ctx.values[column.key]) ?? []

  const minValue = min(values.filter(isNumber)) ?? 0
  const maxValue = max(values.filter(isNumber)) ?? 0

  const value = useMemo(() => {
    if (options.range) {
      return [clamp(options.range[0], minValue, maxValue), clamp(options.range[1], minValue, maxValue)]
    }

    return [minValue, maxValue]
  }, [options.range, minValue, maxValue])

  const onChange = range =>
    dispatch({
      type: 'SET_RANGE',
      payload: { range },
    })

  const [range, setRange, , dirty] = useDebounce(value, 100, onChange)

  const handleChange = ([newMin, newMax]) => {
    if (newMin === minValue && newMax === maxValue) {
      dispatch({
        type: 'RESET',
      })
    } else {
      setRange([
        typeof newMin === 'number' && !Number.isNaN(newMin) ? newMin : minValue,
        typeof newMax === 'number' && !Number.isNaN(newMax) ? newMax : maxValue,
      ])
    }
  }

  return (
    <div
      onClick={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
      onMouseUp={event => event.stopPropagation()}
      style={{ padding: '0.4em 0.75em', marginBottom: '0.5em' }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: 'black', fontWeight: 'normal', margin: '0.3em 0 0.5em 0', flex: 1 }}>
          Select value range:
        </div>
        {dirty && <Icon loading name="spinner" />}
      </div>
      <RangeSelector max={maxValue} min={minValue} onChange={handleChange} value={range} />
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
