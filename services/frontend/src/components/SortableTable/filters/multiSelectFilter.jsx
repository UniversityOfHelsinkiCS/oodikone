import _ from 'lodash'
import React, { useMemo, useState } from 'react'
import { Checkbox, Dropdown, Input } from 'semantic-ui-react'
import { useContextSelector } from 'use-context-selector'

import { SortableTableContext, getColumnValue } from '@/components/SortableTable/common'

const MultiSelectFilterComponent = ({ column, options, dispatch }) => {
  const columnValues = useContextSelector(SortableTableContext, context => context.values[column.key]) ?? []
  const uniqueColumnValues = _.uniq(_.flattenDeep(columnValues))

  const [searchTerm, setSearchTerm] = useState('')
  const { selectedFilters } = options

  const dropdownItems = useMemo(() => {
    if (uniqueColumnValues.length === 0) {
      return []
    }
    const filteredValues = _.uniq(uniqueColumnValues)
      .filter(value => value.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort()
      .map(value => (
        <Dropdown.Item key={value}>
          <Checkbox
            checked={selectedFilters.some(filter => filter === value)}
            label={value}
            onClick={() => dispatch({ type: 'SET_SELECTED_VALUES', payload: { value } })}
          />
        </Dropdown.Item>
      ))

    return filteredValues
  }, [columnValues, searchTerm, selectedFilters])

  return (
    <>
      <Input
        icon="search"
        iconPosition="left"
        onChange={event => setSearchTerm(event.target.value)}
        value={searchTerm}
      />
      <Dropdown.Menu scrolling>{dropdownItems}</Dropdown.Menu>
    </>
  )
}

/**
 * This filter allows the user to select multiple values from a list of values. This is useful for example
 * if you have a column that contains multiple values (like a list of student's study programmes). This way
 * the user can select multiple study programmes and the table will only show students that have at least one
 * of the selected study programmes. If the default filter was used instead, the values that the user is able
 * to filter by are just strings containing all the study programmes that the student has.
 *
 * IMPORTANT: The getRowVal function must return an array of strings for this filter to work.
 */
export const multiSelectColumnFilter = {
  component: MultiSelectFilterComponent,

  initialOptions: () => ({
    selectedFilters: [],
  }),

  reduce: (options, { type, payload }) => {
    if (type === 'SET_SELECTED_VALUES') {
      const { value } = payload
      const { selectedFilters } = options
      const index = selectedFilters.findIndex(filter => filter === value)
      if (index !== -1) {
        selectedFilters.splice(index, 1)
      } else {
        selectedFilters.push(value)
      }
    }
  },

  isActive: options => options.selectedFilters.length !== 0,

  filter: (context, column, options) =>
    options.selectedFilters.length > 0
      ? options.selectedFilters.some(value => getColumnValue(context, column).includes(value))
      : true,
}
