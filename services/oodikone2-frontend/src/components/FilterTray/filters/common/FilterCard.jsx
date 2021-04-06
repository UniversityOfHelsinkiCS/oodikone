import React from 'react'
import PropTypes from 'prop-types'
import { Card, Icon, Header } from 'semantic-ui-react'
import useFilterTray from '../../useFilterTray'

const FilterCard = ({ title, children, footer, active, className, contextKey, name }) => {
  const [open, , toggleOpen] = useFilterTray(contextKey)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: '1rem 0' }} onClick={toggleOpen}>
        <Icon name={open ? 'caret down' : 'caret right'} />
        <Header size="tiny" style={{ marginTop: '0' }}>
          {title}
        </Header>
      </div>
      {open && children}
    </div>
  )

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
