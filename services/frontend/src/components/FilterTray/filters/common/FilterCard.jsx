import React from 'react'
import PropTypes from 'prop-types'
import { Icon, Header } from 'semantic-ui-react'
import useFilterTray from '../../useFilterTray'

const FilterCard = ({ title, children, contextKey, name, active }) => {
  const [open, , toggleOpen] = useFilterTray(contextKey)

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', cursor: active ? undefined : 'pointer', margin: '1rem 0' }}
        onClick={active ? undefined : toggleOpen}
        data-cy={`${name}-header`}
      >
        <Icon name={open ? 'caret down' : 'caret right'} style={{ visibility: active ? 'hidden' : 'visible' }} />
        <Header size="tiny" style={{ marginTop: '0' }}>
          {title}
        </Header>
      </div>
      {(active || open) && children}
    </div>
  )
}

FilterCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  contextKey: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
}

export default FilterCard
