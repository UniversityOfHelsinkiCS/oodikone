/**
 * Context for managing filtering.
 */
import React, { createContext, useMemo, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import _ from 'lodash'
import { selectViewFilters, setFilterOptions, resetViewFilters, resetFilter } from '../../redux/filters'

const defaultState = {
  allStudents: [],
  filteredStudents: [],
}

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

const FilterViewContext = createContext(defaultState)
FilterViewContext.displayName = 'FilterView'

const precompute = (students, filters) =>
  _.chain(filters)
    .filter(({ precompute }) => precompute)
    .map(({ key, precompute }) => [key, precompute[0](students)])
    .fromPairs()
    .value()

const applyFilters = (students, filters, options, precomputed) => {
  return filters
    .filter(({ key, isActive }) => isActive(options[key]))
    .reduce((students, { key, filter }) => {
      return students.filter(student => filter(student, options[key], precomputed[key]))
    }, students)
}

export const FilterView = ({ children, name, filters, students }) => {
  const storeFilterOptions = useSelector(state => selectViewFilters(state, name))
  // const [filteredStudents, setFilteredStudents] = useState([])

  const filterOptions = useMemo(() => resolveFilterOptions(storeFilterOptions, filters), [storeFilterOptions, filters])
  const orderedFilters = filters.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

  const precomputed = useMemo(
    () => precompute(students, orderedFilters),
    [
      students,
      orderedFilters,
      filterOptions,
      ...orderedFilters
        .filter(({ precompute }) => !!precompute)
        .map(({ precompute }) => precompute[1])
        .reduce((a, b) => [...a, ...b], []),
    ]
  )
  const filteredStudents = useMemo(
    () => applyFilters(students, orderedFilters, filterOptions, precomputed),
    [students, orderedFilters, filterOptions, precomputed]
  )

  const dispatch = useDispatch()

  const value = {
    allStudents: students,
    filteredStudents,
    filterOptions,
    filters,
    precomputed,
    withoutFilter: key =>
      applyFilters(
        students,
        orderedFilters.filter(filter => filter.key !== key),
        filterOptions,
        precomputed
      ),
    setFilterOptions: (filter, options) => dispatch(setFilterOptions({ view: name, filter, options })),
    resetFilter: filter => dispatch(resetFilter({ view: name, filter })),
    resetFilters: () => dispatch(resetViewFilters({ view: name })),
  }

  return (
    <FilterViewContext.Provider value={value}>
      {typeof children === 'function' ? children(filteredStudents) : children}
    </FilterViewContext.Provider>
  )
}

const FilterContext = createContext([[], () => {}])
FilterContext.displayName = 'Filters'

/* export const FilterProvider = ({ children, filters }) => {
  const [state, setState] = useState({})
  return <FilterContext.Provider value={[state, setState]}>{children}</FilterContext.Provider>
} */

/* const useFilterView = () => {
  const viewKey = useContext(FilterViewContext)
  const [states, setStates] = useContext(FilterContext)

  const state = states[viewKey] ?? defaultState
  const mapState = (log, mapper) =>
    setStates(prev => {
      const n = produce(prev, draft => {
        if (!draft[viewKey]) {
          draft[viewKey] = _.cloneDeep(defaultState)
        }

        const res = mapper(draft[viewKey])

        if (res !== undefined) {
          draft[viewKey] = res
        }
      })

      return n
    })

  return [state, mapState]
} */

export default () => {
  const ctx = useContext(FilterViewContext)

  return {
    ...ctx,
  }
}
