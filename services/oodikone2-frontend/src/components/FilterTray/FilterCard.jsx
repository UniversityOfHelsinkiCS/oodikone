import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Card } from 'semantic-ui-react'

const FilterCard = ({ title, children, footer }) => {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <Card.Content>
        <Card.Header onClick={() => setOpen(prev => !prev)}>{title}</Card.Header>
        <Card.Description style={open ? null : { display: 'none' }}>{children}</Card.Description>
      </Card.Content>
      {footer && open && <Card.Content extra>{footer}</Card.Content>}
    </Card>
  )
}

FilterCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired,
  footer: PropTypes.element
}

FilterCard.defaultProps = {
  footer: null
}

export default FilterCard
