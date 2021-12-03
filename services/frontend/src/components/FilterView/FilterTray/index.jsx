import React, { useContext } from 'react'
import { Segment, Header, Button } from 'semantic-ui-react'
import './filterTray.css'
import FilterViewContext from '../FilterViewContext'
import FilterCard from '../filters/common/FilterCard'

const FilterTray = () => {
  const {
    filteredStudents,
    allStudents,
    filters,
    withoutFilter,
    filterOptions,
    setFilterOptions,
    resetFilter,
    resetFilters,
    getContextByKey,
  } = useContext(FilterViewContext)

  const isAnyFilterActive = filters.some(({ key, isActive }) => isActive(filterOptions[key]))

  const filterSet = filters.map(filter => {
    const { key, title, isActive, render, info } = filter
    const ctx = getContextByKey(key)

    const props = {
      options: ctx.options,
      onOptionsChange: options => setFilterOptions(key, options),
      withoutSelf: () => withoutFilter(key),
    }

    return (
      <div key={key}>
        <FilterCard
          title={title ?? key}
          active={isActive(filterOptions[key])}
          onClear={() => resetFilter(key)}
          info={info}
          filter={filter}
          options={ctx.options}
        >
          {render(props, ctx)}
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
              <Button compact size="mini" onClick={resetFilters}>
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
