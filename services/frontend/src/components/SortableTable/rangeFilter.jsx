import React, { useCallback, useMemo } from 'react'
import { useContextSelector } from 'use-context-selector'
import { Range, getTrackBackground } from 'react-range'
import _ from 'lodash'
import { Input, Icon } from 'semantic-ui-react'
import { useDebounce } from 'common/hooks'
import { SortableTableContext, getColumnValue } from './common'

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

  const minOnChange = useCallback(newValue => handleChange([parseInt(newValue.target.value, 10), range[1]]), [range[1]])

  const maxOnChange = useCallback(newValue => handleChange([range[0], parseInt(newValue.target.value, 10)]), [range[0]])

  if (min === max) return null

  const rangeValues = [_.clamp(range[0], min, max), _.clamp(range[1], min, max)]

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
      <Range
        step={1}
        min={min}
        max={max}
        values={rangeValues}
        onChange={handleChange}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            onMouseDown={evt => {
              evt.stopPropagation()
              props.onMouseDown(evt)
              return false
            }}
            tabIndex=""
            style={{
              ...props.style,
              height: '3px',
              width: 'calc(100% - 13px)',
              borderRadius: '10px',
              margin: '1em 6px 1.5em 6px',
              background: getTrackBackground({
                min,
                max,
                values: rangeValues,
                colors: ['#f2f2f2', 'rgb(33, 133, 208)', '#f2f2f2'],
              }),
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            tabIndex=""
            style={{
              ...props.style,
              height: '13px',
              width: '13px',
              backgroundColor: '#f2f2f2',
              border: '3px solid rgb(33, 133, 208)',
              borderRadius: '10px',
            }}
          />
        )}
      />

      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5em' }}>
        <Input
          value={range[0]}
          style={{ flexShrink: 1, width: '5em' }}
          onChange={minOnChange}
          onFocus={e => e.stopPropagation()}
        />
        <span style={{ margin: '0 0.5em' }}>&mdash;</span>
        <Input
          value={range[1]}
          style={{ flexShrink: 1, width: '5em' }}
          onChange={maxOnChange}
          onFocus={e => e.stopPropagation()}
        />
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
