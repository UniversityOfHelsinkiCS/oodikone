import React from 'react'
import PropTypes from 'prop-types'
import { Icon, Header } from 'semantic-ui-react'
import useFilterTray from '../../useFilterTray'

const FilterCard = ({ title, children, contextKey, name }) => {
  const [open, , toggleOpen] = useFilterTray(contextKey)

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: '1rem 0' }}
        onClick={toggleOpen}
        data-cy={`${name}-header`}
      >
        <Icon name={open ? 'caret down' : 'caret right'} />
        <Header size="tiny" style={{ marginTop: '0' }}>
          {title}
        </Header>
      </div>
      {open && children}
    </div>
  )
}

FilterCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  contextKey: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
}

export default FilterCard
