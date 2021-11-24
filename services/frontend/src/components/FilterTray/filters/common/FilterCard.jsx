import React from 'react'
import { Icon, Header } from 'semantic-ui-react'
import WithHelpTooltip from '../../../Info/InfoWithHelpTooltip'
import useFilterTray from '../../useFilterTray'

const FilterCard = ({ title, children, contextKey, name, active, info }) => {
  const [open, , toggleOpen] = useFilterTray(contextKey)

  const renderWithHelp = info => {
    if (info) {
      return (
        <WithHelpTooltip tooltip={info} data-cy="tooltip-div">
          <Icon name={open ? 'caret down' : 'caret right'} style={{ visibility: active ? 'hidden' : 'visible' }} />
          <Header size="tiny" style={{ marginTop: '0', marginBottom: 0 }}>
            {title}
          </Header>
        </WithHelpTooltip>
      )
    }
    return (
      <>
        <Icon name={open ? 'caret down' : 'caret right'} style={{ visibility: active ? 'hidden' : 'visible' }} />
        <Header size="tiny" style={{ marginTop: '0', marginBottom: 0 }}>
          {title}
        </Header>
      </>
    )
  }

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', cursor: active ? undefined : 'pointer', margin: '1rem 0' }}
        onClick={active ? undefined : toggleOpen}
        data-cy={`${name}-header`}
      >
        {renderWithHelp(info)}
      </div>
      {(active || open) && children}
    </div>
  )
}

export default FilterCard
