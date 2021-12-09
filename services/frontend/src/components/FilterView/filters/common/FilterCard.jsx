import React, { useState } from 'react'
import { Icon, Header } from 'semantic-ui-react'
import WithHelpTooltip from '../../../Info/InfoWithHelpTooltip'

import './FilterCard.css'

const FilterCard = ({ filter, options, children, onClear }) => {
  const title = filter.title ?? filter.key
  const active = filter.isActive(options)
  const { info, key } = filter

  const [open, setOpen] = useState(false)

  let header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        flexGrow: 1,
      }}
      className="filter-card-header"
      onClick={() => setOpen(!open)}
      data-cy={`${key}-header`}
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
          name="trash alternate outline"
          onClick={evt => {
            evt.stopPropagation()
            onClear()
          }}
          className="filter-clear-icon"
        />
      )}
    </div>
  )

  if (info) {
    header = (
      <WithHelpTooltip containerStyle={{ alignItems: 'center' }} tooltip={info} data-cy="tooltip-div">
        {header}
      </WithHelpTooltip>
    )
  }

  return (
    <div style={{ margin: '1rem 0' }} data-cy={`${key}-filter-card`}>
      <div style={{ marginBottom: '1rem' }}>{header}</div>
      {open && children}
    </div>
  )
}

export default FilterCard
