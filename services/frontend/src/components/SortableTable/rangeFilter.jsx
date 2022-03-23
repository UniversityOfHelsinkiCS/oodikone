import React, { useCallback, useMemo, useContext } from 'react'
import _ from 'lodash'
import { Slider } from 'react-semantic-ui-range'
import { Input, Icon } from 'semantic-ui-react'
import { useDebounce } from 'common/hooks'
import { SortableTableContext, getColumnValue } from './common'

const RangeColumnFilterComponent = ({ column, options, dispatch }) => {
  const { values } = useContext(SortableTableContext)

  const min = _.min(values[column.key])
  const max = _.max(values[column.key])

  const value = useMemo(() => {
    if (options.range) {
      return [_.clamp(options.range[0], min, max), _.clamp(options.range[1], min, max)]
    }

    return [min, max]
  }, [options.range, min, max])

  const onChange = useCallback(
    _.debounce(
      range =>
        dispatch({
          type: 'SET_RANGE',
          payload: { range },
        }),
      1000
    ),
    [dispatch]
  )

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

  const minOnChange = useCallback(newValue => handleChange([parseInt(newValue.target.value, 10), range[1]]), [range[1]])

  const maxOnChange = useCallback(newValue => handleChange([range[0], parseInt(newValue.target.value, 10)]), [range[0]])

  return (
    <div style={{ padding: '0.4em 0.75em' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: 'black', fontWeight: 'normal', margin: '0.3em 0 0.5em 0', flex: 1 }}>
          Select value range:
        </div>
        {dirty && <Icon loading name="spinner" />}
      </div>
      <Slider
        value={[_.clamp(range[0], min, max), _.clamp(range[1], min, max)]}
        settings={{
          min,
          max,
          step: 1,
          onChange: handleChange,
        }}
        multiple
        color="blue"
      />

      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5em' }}>
        <Input value={range[0]} style={{ flexShrink: 1, width: '5em' }} onChange={minOnChange} />
        <span style={{ margin: '0 0.5em' }}>&mdash;</span>
        <Input value={range[1]} style={{ flexShrink: 1, width: '5em' }} onChange={maxOnChange} />
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
