import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from 'semantic-ui-react'
import './filterToggleIcon.css'

export const FilterToggleIcon = ({ onClick, isActive }) => (
  <span className={`flexIcon ${isActive ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
    <Icon onClick={onClick} name="filter" />
    <Icon onClick={onClick} name={isActive ? 'remove' : 'add'} size="tiny" />
  </span>
)

FilterToggleIcon.propTypes = {
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
}
