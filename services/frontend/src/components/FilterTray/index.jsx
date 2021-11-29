import React from 'react'
import { Segment, Header, Button } from 'semantic-ui-react'
import './filterTray.css'
import useFilters from './useFilters'
import FilterCard from './filters/common/FilterCard'

export const contextKey = 'filterTray'

const FilterTray = () => {
  const {
    filteredStudents,
    allStudents,
    precomputed,
    filters,
    withoutFilter,
    filterOptions,
    setFilterOptions,
    resetFilter,
  } = useFilters()

  const isAnyFilterActive = filters.some(({ key, isActive }) => isActive(filterOptions[key]))

  const filterSet = filters.map(({ key, title, isActive, render, info }) => {
    const props = {
      options: filterOptions[key],
      onOptionsChange: options => setFilterOptions(key, options),
      withoutSelf: () => withoutFilter(key),
    }

    return (
      <div key={key}>
        <FilterCard title={title ?? key} active={isActive(filterOptions[key])} onClear={() => resetFilter(key)} info={info}>
          {render(props, precomputed[key])}
        </FilterCard>
      </div>
    )
  })

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'flex-start', width: '100%' }}>
        <Segment style={{ marginLeft: '0.5rem', width: '16rem', position: 'sticky', top: '10px' }}>
          <Header size="small" style={{ textAlign: 'center' }} data-cy="filtered-students">
            Filter students
          </Header>
          <div style={{ textAlign: 'center' }}>
            <b>
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
            </b>{' '}
            out of {allStudents.length} shown
          </div>
          {isAnyFilterActive && (
            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <Button compact size="mini">
                Reset All Filters
              </Button>
            </div>
          )}
          {filterSet}
        </Segment>
      </div>
    </>
  )
}

export default FilterTray
