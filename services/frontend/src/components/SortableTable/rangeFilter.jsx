import React, { useCallback, useMemo, useContext } from 'react'

import _ from 'lodash'
import { Slider } from 'react-semantic-ui-range'
import { Input } from 'semantic-ui-react'
import { SortableTableContext, getColumnValue } from './common'

const RangeColumnFilterComponent = ({ column, options, dispatch }) => {
  const { values } = useContext(SortableTableContext)

  const min = _.min(values[column.key])
  const max = _.max(values[column.key])

  const value = useMemo(() => {
    if (options.range) {
      return options.range
    }
    return [min, max]
  }, [options.range, min, max])

  const onChange = useCallback(
    _.debounce(range =>
      dispatch({
        type: 'SET_RANGE',
        payload: { range },
      })
    ),
    1000
  )

  const minOnChange = useCallback(
    evt =>
      dispatch({
        type: 'SET_RANGE',
        payload: {
          range: [parseInt(evt.target.value, 10), value[1]],
        },
      }),
    [value[1]]
  )

  const maxOnChange = useCallback(
    evt =>
      dispatch({
        type: 'SET_RANGE',
        payload: {
          range: [value[0], parseInt(evt.target.value, 10)],
        },
      }),
    [value[0]]
  )

  return (
    <div style={{ padding: '0.4em 0.75em' }}>
      <div style={{ color: 'black', fontWeight: 'normal', margin: '0.3em 0 0.5em 0' }}>Select value range:</div>
      <Slider
        value={value}
        settings={{
          start: [min, max],
          min,
          max,
          step: 1,
          onChange,
        }}
        multiple
        color="blue"
      />

      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5em' }}>
        <Input value={value[0]} style={{ flexShrink: 1, width: '5em' }} onChange={minOnChange} />
        <span style={{ margin: '0 0.5em' }}>&mdash;</span>
        <Input value={value[1]} style={{ flexShrink: 1, width: '5em' }} onChange={maxOnChange} />
      </div>
    </div>
  )
}

export default {
  component: RangeColumnFilterComponent,

  initialOptions: () => ({
    range: undefined,
  }),

  reduce: (options, { type, payload }) => {
    if (type === 'SET_RANGE') {
      options.range = payload.range
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
