import React, { useState } from 'react'
import { Icon, Header } from 'semantic-ui-react'
import WithHelpTooltip from '../../../Info/InfoWithHelpTooltip'
import ClearFilterButton from './ClearFilterButton'

const FilterCard = ({ title, children, name, active, onClear, info }) => {
  const [open, setOpen] = useState(active)

  const header = (
    <>
      <Icon
        name={open ? 'caret down' : 'caret right'}
        style={{
          color: active ? '#DDD' : 'black',
        }}
      />
      <Header size="tiny" style={{ margin: '0' }}>
        {title}
      </Header>
      <div style={{ flexGrow: 1, minWidth: '1rem' }} />
      {active && <ClearFilterButton onClick={onClear} />}
    </>
  );

  const renderWithHelp = info => {
    if (info) {
      return (
        <WithHelpTooltip tooltip={info} data-cy="tooltip-div">{header}</WithHelpTooltip>
      )
    }

    return header;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: active ? undefined : 'pointer',
          margin: '1rem 0',
        }}
        onClick={!active && (() => setOpen(!open))}
        data-cy={`${name}-header`}
      >
        {renderWithHelp(info)}
      </div>
      {(active || open) && children}
    </div>
  )
}

export default FilterCard
