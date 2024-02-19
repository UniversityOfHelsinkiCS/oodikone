import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import produce from 'immer'
import * as _ from 'lodash-es'
import fp from 'lodash/fp'

import { selectViewFilters, setFilterOptions, resetViewFilters, resetFilter } from 'redux/filters'
import { FilterViewContext } from './FilterViewContext'
import { FilterTray } from './FilterTray'

const resolveFilterOptions = (store, filters, initialOptions) => {
  return fp.flow(
    fp.map(({ key, defaultOptions }) => [
      key,
      [store[key]?.options, !store[key] ? _.get(initialOptions, key) : null, defaultOptions],
    ]),
    fp.fromPairs,
    fp.mapValues(values => _.find(values))
  )(filters)
}

export const FilterView = ({
  children,
  name,
  filters: pFilters,
  students,
  displayTray: displayTrayProp,
  initialOptions,
}) => {
  const storeFilterOptions = useSelector(state => selectViewFilters(state, name))
  const filters = pFilters.map(filter => (typeof filter === 'function' ? filter() : filter))
  const filtersByKey = _.keyBy(filters, 'key')
  const filterOptions = useMemo(
    () => resolveFilterOptions(storeFilterOptions, filters, initialOptions),
    [storeFilterOptions, filters, initialOptions]
  )
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
      return students
        .map(student => {
          const res = []
          const newStudent = produce(student, s => {
            res.push(filter(s, ctx.options, ctx))
          })
          res.push(newStudent)
          return res
        })
        .filter(([keep]) => keep)
        .map(([, student]) => student)
    }, students)
  )

  const filteredStudents = useMemo(
    () => applyFilters(orderedFilters),
    [students, orderedFilters, filterOptions, precomputed]
  )

  const areOptionsDirty = key => !!storeFilterOptions[key]

  const dispatch = useDispatch()

  const value = {
    viewName: name,
    getContextByKey: getFilterContext,
    allStudents: students,
    filteredStudents,
    filterOptions,
    filters,
    precomputed,
    areOptionsDirty,
    withoutFilter: key => applyFilters(orderedFilters.filter(filter => filter.key !== key)),
    setFilterOptions: (filter, options) => dispatch(setFilterOptions({ view: name, filter, options })),
    resetFilter: filter => dispatch(resetFilter({ view: name, filter })),
    resetFilters: () => dispatch(resetViewFilters({ view: name })),
  }

  return (
    <FilterViewContext.Provider value={value}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'center', gap: '0.75rem' }}>
        <div style={{ zIndex: 1, alignSelf: 'flex-start', position: 'sticky', top: '1rem' }}>
          {displayTray && <FilterTray />}
        </div>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          {typeof children === 'function' ? children(filteredStudents) : children}
        </div>
      </div>
    </FilterViewContext.Provider>
  )
}
