import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import _ from 'lodash'
import fp from 'lodash/fp'
import { selectViewFilters, setFilterOptions, resetViewFilters, resetFilter } from '../../redux/filters'
import FilterViewContext from './FilterViewContext'
import FilterTray from './FilterTray'

/* const getFilterContext = (filter, students, options, precomputed) => ({
  options: options[filter.key] ?? filter.defaultOptions,
  students,
  precomputed: precomputed[filter.key],
})

const precompute = (students, filters, options) =>
  _.chain(filters)
    .filter(({ precompute }) => precompute)
    .map(({ key, precompute, defaultOptions }) => precompute({
      students,
      options: options[key] ?? defaultOptions,
      precomputed: null,
    }))
    .fromPairs()
    .value()

const applyFilters = (students, filters, options, precomputed) => {
  return filters
    .map((filter) => [filter, { students, options: options[filter.key], precomputed: precomputed[filter.key] }])
    .filter(([{ key, isActive }, ctx]) => isActive(options[key], ctx))
    .reduce((students, [{ key, filter }, ctx]) => {
      return students.filter(student => filter(student, options[key], precomputed[key]))
    }, students)
} */

const resolveFilterOptions = (options, filters) => {
  const providedOptions = Object.entries(options).filter(([key]) => filters.find(filter => filter.key === key))

  const missingDefaultOptions = filters
    .filter(({ key }) => providedOptions.find(([k]) => k === key) === undefined)
    .map(({ key, defaultOptions }) => [key, defaultOptions])

  return {
    ...Object.fromEntries(providedOptions),
    ...Object.fromEntries(missingDefaultOptions),
  }
}

const FilterView = ({ children, name, filters: pFilters, students, displayTray: displayTrayProp }) => {
  const storeFilterOptions = useSelector(state => selectViewFilters(state, name))

  const filters = pFilters.map(filter => (typeof filter === 'function' ? filter() : filter))
  const filtersByKey = _.keyBy(filters, 'key')
  const filterOptions = useMemo(() => resolveFilterOptions(storeFilterOptions, filters), [storeFilterOptions, filters])
  const orderedFilters = filters.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

  const displayTray = displayTrayProp !== undefined ? !!displayTrayProp : true

  const precompute = fp.flow(
    fp.filter(({ precompute }) => precompute),
    fp.keyBy('key'),
    fp.mapValues(({ precompute, key }) =>
      precompute({
        students,
        options: filterOptions[key] ?? filtersByKey[key].defaultOptions,
        precomputed: null,
        args: filtersByKey[key].args,
      })
    )
  )

  const precomputed = useMemo(() => precompute(orderedFilters), [students, orderedFilters, filterOptions])

  const getFilterContext = key => {
    const filter = filtersByKey[key]

    if (filter === undefined) {
      return { students, options: null, precomputed: null, args: null }
    }

    return {
      students,
      options: filterOptions[key],
      precomputed: precomputed[key],
      args: filtersByKey[key].args,
    }
  }

  const applyFilters = fp.flow(
    fp.map(filter => [filter, getFilterContext(filter.key)]),
    fp.filter(([{ key, isActive }, ctx]) => isActive(filterOptions[key], ctx)),
    fp.reduce((students, [{ filter }, ctx]) => {
      return students.filter(student => filter(student, ctx.options, ctx))
    }, students)
  )

  const filteredStudents = useMemo(
    () => applyFilters(orderedFilters),
    [students, orderedFilters, filterOptions, precomputed]
  )

  const dispatch = useDispatch()

  const value = {
    viewName: name,
    getContextByKey: getFilterContext,
    allStudents: students,
    filteredStudents,
    filterOptions,
    filters,
    precomputed,
    withoutFilter: key => applyFilters(orderedFilters.filter(filter => filter.key !== key)),
    setFilterOptions: (filter, options) => dispatch(setFilterOptions({ view: name, filter, options })),
    resetFilter: filter => dispatch(resetFilter({ view: name, filter })),
    resetFilters: () => dispatch(resetViewFilters({ view: name })),
  }

  return (
    <FilterViewContext.Provider value={value}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'center', gap: '0.75rem' }}>
        <div style={{ alignSelf: 'flex-start', position: 'sticky', top: '1rem' }}>{displayTray && <FilterTray />}</div>
        <div style={{ flexGrow: 1 }}>{typeof children === 'function' ? children(filteredStudents) : children}</div>
      </div>
    </FilterViewContext.Provider>
  )
}

export default FilterView
