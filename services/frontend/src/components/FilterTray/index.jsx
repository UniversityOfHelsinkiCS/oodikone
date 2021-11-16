import React from 'react'
import { Segment, Header } from 'semantic-ui-react'
import './filterTray.css'
import useFilters from './useFilters'

export const contextKey = 'filterTray'

const FilterTray = ({ children, filterSet, visible = true }) => {
  const { filteredStudents, allStudents } = useFilters()

  if (!visible || !allStudents.length) {
    return children
  }

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'flex-start', width: '100%' }}>
        <Segment style={{ marginLeft: '0.5rem', width: '12rem', position: 'sticky', top: '10px' }}>
          <Header size="small" style={{ textAlign: 'center' }} data-cy="filtered-students">
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

export default FilterTray
