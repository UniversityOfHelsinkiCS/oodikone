import React, { useState, useCallback } from 'react'
import { Range, getTrackBackground } from 'react-range'
import * as _ from 'lodash-es'
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
        step={1}
        min={isDisabled ? 0 : min}
        max={isDisabled ? 1 : max}
        values={isDisabled ? [0, 1] : rangeValues}
        onChange={isDisabled ? _.noop : onChange}
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
                min: isDisabled ? 0 : min,
                max: isDisabled ? 1 : max,
                values: isDisabled ? [0, 1] : rangeValues,
                colors: isDisabled ? ['#f2f2f2', '#f2f2f2', '#f2f2f2'] : ['#f2f2f2', 'rgb(33, 133, 208)', '#f2f2f2'],
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
              border: isDisabled ? '#f2f2f2' : '3px solid rgb(33, 133, 208)',
              borderRadius: '10px',
            }}
          />
        )}
      />

      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5em' }}>
        <Input
          error={dirtyMin !== null}
          value={dirtyMin ?? value[0]}
          disabled={isDisabled}
          style={{ flexShrink: 1, width: '5em' }}
          onChange={minOnChange}
          onFocus={e => e.stopPropagation()}
          onBlur={() => setDirtyMin(null)}
          data-cy="range-selector-min"
        />
        <span style={{ margin: '0 0.5em' }}>&mdash;</span>
        <Input
          error={dirtyMax !== null}
          value={dirtyMax ?? value[1]}
          style={{ flexShrink: 1, width: '5em' }}
          disabled={isDisabled}
          onChange={maxOnChange}
          onFocus={e => e.stopPropagation()}
          onBlur={() => setDirtyMax(null)}
          data-cy="range-selector-max"
        />
      </div>
    </div>
  )
}
