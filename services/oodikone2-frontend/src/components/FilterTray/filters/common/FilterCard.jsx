import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Card, Icon } from 'semantic-ui-react'
import { useStore } from 'react-hookstore'

const FilterCard = ({ title, children, footer, active }) => {
  const [clickSaver] = useStore('clickSaver')
  const [open, setOpen] = useState(clickSaver)

  return (
    <Card className={active ? 'active-filter' : null}>
      <Card.Content>
        <Card.Header onClick={() => setOpen(prev => !prev)}>
          <Icon name={open ? 'caret down' : 'caret right'} />
          <div className="card-header-text">{title}</div>
          {active && <Icon name="check" color="green" className="filter-status-icon" />}
        </Card.Header>
        <Card.Description style={open ? null : { display: 'none' }}>{children}</Card.Description>
      </Card.Content>
      {footer && open && <Card.Content extra>{footer}</Card.Content>}
    </Card>
  )
}

FilterCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.element,
  active: PropTypes.bool
}

FilterCard.defaultProps = {
  footer: null,
  active: false
}

export default FilterCard
