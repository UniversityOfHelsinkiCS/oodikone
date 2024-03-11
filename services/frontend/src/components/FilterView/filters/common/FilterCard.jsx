import _ from 'lodash'
import React, { useState, useRef } from 'react'
import { Icon, Header } from 'semantic-ui-react'

import { InfoWithHelpTooltip } from '@/components/Info/InfoWithHelpTooltip'
import './FilterCard.css'

const useChange = value => {
  const prevValue = useRef()

  if (prevValue.current === undefined) {
    prevValue.current = value
    return true
  }

  const change = !_.isEqual(value, prevValue.current)

  prevValue.current = value

  return change
}

export const FilterCard = ({ filter, options, children, onClear }) => {
  const title = filter.title ?? filter.key
  const active = filter.isActive(options)
  const { info, key } = filter

  const hasChanged = useChange(options)

  const [manuallyOpened, setManuallyOpened] = useState(null)

  if (hasChanged && manuallyOpened === false) {
    setManuallyOpened(null)
  }

  const open = manuallyOpened !== null ? manuallyOpened : active

  let header = (
    <div
      className="filter-card-header"
      data-cy={`${key}-header`}
      onClick={() => setManuallyOpened(!open)}
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        flexGrow: 1,
      }}
    >
      <Icon name={open ? 'caret down' : 'caret right'} style={{ color: 'black', flexShrink: 0 }} />
      <Header size="tiny" style={{ margin: '0' }}>
        {title}
      </Header>
      {active && (
        <div
          style={{
            backgroundColor: '#2185d0',
            flexShrink: 0,
            marginLeft: '0.5rem',
            borderRadius: '9999px',
            width: '0.5rem',
            height: '0.5rem',
            marginTop: '0.2em',
          }}
        />
      )}
      <div style={{ flexGrow: 1, minWidth: '1rem' }} />
      {active && (
        <Icon
          className="filter-clear-icon"
          name="trash alternate outline"
          onClick={evt => {
            evt.stopPropagation()
            onClear()
          }}
        />
      )}
    </div>
  )

  if (info) {
    header = (
      <InfoWithHelpTooltip containerStyle={{ alignItems: 'center' }} data-cy="tooltip-div" tooltip={info}>
        {header}
      </InfoWithHelpTooltip>
    )
  }

  return (
    <div data-cy={`${key}-filter-card`} data-open={open} style={{ margin: '1rem 0' }}>
      <div style={{ marginBottom: '1rem' }}>{header}</div>
      {open && <div onClick={() => setManuallyOpened(true)}>{children}</div>}
    </div>
  )
}
