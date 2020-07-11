import React from 'react'
import PropTypes from 'prop-types'
import { Card, Icon } from 'semantic-ui-react'
import useFilterTray from '../../useFilterTray'

const FilterCard = ({ title, children, footer, active, className, contextKey, name }) => {
  const [open, , toggleOpen] = useFilterTray(contextKey)

  return (
    <Card className={`${className} ${active ? 'active-filter' : ''}`}>
      <Card.Content>
        <Card.Header onClick={toggleOpen} data-cy={`${name}-header`}>
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
  active: PropTypes.bool,
  className: PropTypes.string,
  contextKey: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired
}

FilterCard.defaultProps = {
  footer: null,
  active: false,
  className: ''
}

export default FilterCard
