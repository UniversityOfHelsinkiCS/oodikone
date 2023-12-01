import React, { useContext } from 'react'
import { Segment, Header, Button } from 'semantic-ui-react'
import './filterTray.css'
import { FilterViewContext } from '../FilterViewContext'
import { FilterCard } from '../filters/common/FilterCard'

export const FilterTray = () => {
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
    areOptionsDirty,
  } = useContext(FilterViewContext)

  const haveOptionsBeenChanged = filters.some(({ key }) => areOptionsDirty(key))

  const filterSet = filters
    .sort((a, b) => (a.title ?? a.key).localeCompare(b.title ?? b.key))
    .map(filter => {
      const { key, title, isActive, render, info } = filter
      const ctx = getContextByKey(key)

      const props = {
        options: ctx.options,
        onOptionsChange: options => {
          setFilterOptions(key, options)
        },
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
    <div style={{ display: 'inline-flex', alignItems: 'flex-start', width: '100%' }}>
      <Segment
        style={{
          marginLeft: '0.5rem',
          width: '16rem',
          position: 'sticky',
          top: '10px',
          maxHeight: '100vh',
          overflowY: 'auto',
        }}
      >
        <Header size="small" style={{ textAlign: 'center' }} data-cy="filtered-students">
          Filter students
        </Header>
        <div style={{ textAlign: 'center' }}>
          <b>
            {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
          </b>{' '}
          out of {allStudents.length} shown
        </div>
        {haveOptionsBeenChanged && (
          <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
            <Button compact size="mini" onClick={resetFilters} data-cy="reset-all-filters">
              Reset All Filters
            </Button>
          </div>
        )}
        {filterSet}
      </Segment>
    </div>
  )
}
