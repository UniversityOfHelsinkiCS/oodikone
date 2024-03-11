import PropTypes from 'prop-types'
import React from 'react'
import { Icon } from 'semantic-ui-react'

import './filterToggleIcon.css'

export const FilterToggleIcon = ({ onClick, isActive }) => (
  <span className={`flexIcon ${isActive ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
    <Icon name="filter" onClick={onClick} />
    <Icon name={isActive ? 'remove' : 'add'} onClick={onClick} size="tiny" />
  </span>
)

FilterToggleIcon.propTypes = {
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
}
