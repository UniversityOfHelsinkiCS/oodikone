import React from 'react'
import PropTypes from 'prop-types'
import { Segment, Header } from 'semantic-ui-react'
import './filterTray.css'
import useFilters from './useFilters'

export const contextKey = 'filterTray'

const FilterTray = ({ children, filterSet, visible }) => {
  const { filteredStudents, allStudents } = useFilters()

  if (!visible || !allStudents.length) {
    return children
  }

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'flex-start' }}>
        <Segment style={{ marginLeft: '0.5rem', width: '12rem', position: 'sticky', top: '10px' }}>
          <Header size="small" style={{ textAlign: 'center' }}>
            Filter students
          </Header>
          <div style={{ textAlign: 'center' }}>
            <b>
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
            </b>{' '}
            out of {allStudents.length} shown
          </div>
          {filterSet}
        </Segment>
        {children}
      </div>
    </>
  )
}

FilterTray.propTypes = {
  children: PropTypes.node.isRequired,
  filterSet: PropTypes.node.isRequired,
  visible: PropTypes.bool
}

FilterTray.defaultProps = {
  visible: true
}

export default FilterTray
