import { useContext } from 'react'
import { Button, Header, Segment } from 'semantic-ui-react'

import { FilterViewContext } from './context'
import { FilterCard } from './filters/common/FilterCard'

export const FilterTray = () => {
  const {
    filteredStudents,
    allStudents,
    filters,
    withoutFilter,
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
      const { key, render } = filter
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
          <FilterCard filter={filter} onClear={() => resetFilter(key)} options={ctx.options}>
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
        <Header data-cy="filtered-students" size="small" style={{ textAlign: 'center' }}>
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
            <Button compact data-cy="reset-all-filters" onClick={resetFilters} size="mini">
              Reset All Filters
            </Button>
          </div>
        )}
        {filterSet}
      </Segment>
    </div>
  )
}
