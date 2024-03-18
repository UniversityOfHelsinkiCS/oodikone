import _ from 'lodash'
import React, { useState, useCallback } from 'react'
import { Range, getTrackBackground } from 'react-range'
import { Input } from 'semantic-ui-react'

export const RangeSelector = ({ min, max, value, onChange, disabled = false }) => {
  const [dirtyMin, setDirtyMin] = useState(null)
  const [dirtyMax, setDirtyMax] = useState(null)

  const minOnChange = useCallback(
    newValue => {
      const numValue = parseInt(newValue.target.value, 10)

      if (Number.isNaN(numValue)) {
        setDirtyMin(newValue.target.value)
      } else {
        setDirtyMin(null)
        onChange([numValue, value[1]])
      }
    },
    [value[1]]
  )

  const maxOnChange = useCallback(
    newValue => {
      const numValue = parseInt(newValue.target.value, 10)

      if (Number.isNaN(numValue)) {
        setDirtyMax(newValue.target.value)
      } else {
        setDirtyMax(null)
        onChange([value[0], numValue])
      }
    },
    [value[0]]
  )

  const rangeValues = [_.clamp(value[0], min, max), _.clamp(value[1], min, max)]

  const isDisabled =
    disabled ||
    Number.isNaN(min) ||
    Number.isNaN(max) ||
    Number.isNaN(rangeValues[0]) ||
    Number.isNaN(rangeValues[1]) ||
    min >= max

  return (
    <div>
      <Range
        max={isDisabled ? 1 : max}
        min={isDisabled ? 0 : min}
        onChange={isDisabled ? _.noop : onChange}
        renderThumb={({ props }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: '13px',
              width: '13px',
              backgroundColor: '#f2f2f2',
              border: isDisabled ? '#f2f2f2' : '3px solid rgb(33, 133, 208)',
              borderRadius: '10px',
            }}
            tabIndex=""
          />
        )}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            onMouseDown={event => {
              event.stopPropagation()
              props.onMouseDown(event)
              return false
            }}
            style={{
              ...props.style,
              height: '3px',
              width: 'calc(100% - 13px)',
              borderRadius: '10px',
              margin: '1em 6px 1.5em 6px',
              background: getTrackBackground({
                min: isDisabled ? 0 : min,
                max: isDisabled ? 1 : max,
                values: isDisabled ? [0, 1] : rangeValues,
                colors: isDisabled ? ['#f2f2f2', '#f2f2f2', '#f2f2f2'] : ['#f2f2f2', 'rgb(33, 133, 208)', '#f2f2f2'],
              }),
            }}
            tabIndex=""
          >
            {children}
          </div>
        )}
        step={1}
        values={isDisabled ? [0, 1] : rangeValues}
      />

      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5em' }}>
        <Input
          data-cy="range-selector-min"
          disabled={isDisabled}
          error={dirtyMin !== null}
          onBlur={() => setDirtyMin(null)}
          onChange={minOnChange}
          onFocus={event => event.stopPropagation()}
          style={{ flexShrink: 1, width: '5em' }}
          value={dirtyMin ?? value[0]}
        />
        <span style={{ margin: '0 0.5em' }}>&mdash;</span>
        <Input
          data-cy="range-selector-max"
          disabled={isDisabled}
          error={dirtyMax !== null}
          onBlur={() => setDirtyMax(null)}
          onChange={maxOnChange}
          onFocus={event => event.stopPropagation()}
          style={{ flexShrink: 1, width: '5em' }}
          value={dirtyMax ?? value[1]}
        />
      </div>
    </div>
  )
}
