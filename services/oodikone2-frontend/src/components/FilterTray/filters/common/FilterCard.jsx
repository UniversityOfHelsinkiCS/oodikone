import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Icon } from 'semantic-ui-react'
import useFeatureToggle from '../../../../common/useFeatureToggle'
import useFilterTray from '../../useFilterTray'

const FilterCard = ({ title, children, footer, active, className, contextKey }) => {
  const [clickSaver] = useFeatureToggle('clickSaver')
  const [open, setOpen, toggleOpen] = useFilterTray(contextKey)

  useEffect(() => {
    setOpen(clickSaver)
  }, [])

  return (
    <Card className={`${className} ${active ? 'active-filter' : ''}`}>
      <Card.Content>
        <Card.Header onClick={toggleOpen}>
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
  contextKey: PropTypes.string.isRequired
}

FilterCard.defaultProps = {
  footer: null,
  active: false,
  className: ''
}

export default FilterCard
