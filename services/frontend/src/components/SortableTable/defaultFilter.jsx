import React, { useMemo, useState } from 'react'
import { useContextSelector } from 'use-context-selector'
import _ from 'lodash'
import { Icon, Input, Dropdown } from 'semantic-ui-react'
import { SortableTableContext, getColumnValue } from './common'

const ValueFilterType = {
  Include: 'include',
  Exclude: 'exclude',
}

const VALUE_FILTER_FUNCTIONS = {
  [ValueFilterType.Include]: (a, b) => (a === b ? true : null),
  [ValueFilterType.Exclude]: (a, b) => (a === b ? false : null),
}

const DefaultColumnFilterComponent = ({ column, options, dispatch }) => {
  const [search, setSearch] = useState('')
  const values = useContextSelector(SortableTableContext, ctx => ctx.values[column.key] ?? [])
  const { valueFilters } = options

  const valueItems = useMemo(() => {
    if (!values) {
      return []
    }

    const t = _.uniq(values)
      .filter(value => search === '' || `${value}`.indexOf(search) > -1)
      .sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b
        }
        if (a instanceof Date && b instanceof Date) {
          return a.getTime() - b.getTime()
        }
        return `${a}` - `${b}`
      })
      .map(value => {
        let icon = 'square outline'
        let color = 'inherit'

        const filter = valueFilters.find(f => f.value === value)

        if (filter) {
          if (filter.type === 'exclude') {
            icon = 'minus square outline'
            color = 'red'
          } else if (filter.type === 'include') {
            icon = 'plus square outline'
            color = 'green'
          }
        }

        const text = column.formatValue ? column.formatValue(value) : value

        return (
          <Dropdown.Item
            icon={<Icon name={icon} style={{ color }} />}
            text={
              text !== undefined && text !== null ? (
                `${text}`
              ) : (
                <span style={{ color: 'gray', fontStyle: 'italic' }}>Empty</span>
              )
            }
            onClick={evt => {
              dispatch({
                type: 'CYCLE_VALUE_FILTER',
                payload: {
                  column: column.key,
                  value,
                },
              })

              evt.preventDefault()
              evt.stopPropagation()
            }}
          />
        )
      })

    return t
  }, [values, search, valueFilters])

  return (
    <>
      <Input
        icon="search"
        iconPosition="left"
        onKeyDown={evt => {
          if (evt.keyCode === 13) {
            const visibleValues = _.uniq(values).filter(value => search === '' || `${value}`.indexOf(search) > -1)

            const visibleTypes = _.chain(valueFilters)
              .filter(f => _.includes(visibleValues, f.value))
              .map('type')
              .uniq()
              .value()

            let newType = 'include'

            if (visibleTypes.length <= 1) {
              const [type] = visibleTypes

              if (type === 'include') {
                newType = 'exclude'
              } else if (type === 'exclude') {
                newType = null
              } else {
                newType = 'include'
              }
            }

            dispatch({
              type: 'SET_VALUE_FILTERS',
              payload: { column: column.key, values: visibleValues, type: newType },
            })

            evt.preventDefault()
            evt.stopPropagation()
          }
        }}
        onClick={e => e.stopPropagation()}
        value={search}
        onChange={evt => setSearch(evt.target.value)}
      />
      <Dropdown.Menu scrolling>{valueItems}</Dropdown.Menu>
    </>
  )
}

export default {
  component: DefaultColumnFilterComponent,

  isActive: options => options?.valueFilters?.length,

  initialOptions: () => ({
    valueFilters: [],
  }),

  reduce: (options, { type, payload }) => {
    if (type === 'CYCLE_VALUE_FILTER') {
      const existingIndex = options.valueFilters.findIndex(vf => vf.value === payload.value)
      const existing = options.valueFilters[existingIndex]

      if (existing) {
        if (existing.type === 'include') {
          existing.type = 'exclude'
        } else {
          options.valueFilters.splice(existingIndex, 1)
        }
      } else {
        options.valueFilters.push({ value: payload.value, type: 'include' })
      }
    } else if (type === 'SET_VALUE_FILTERS') {
      payload.values.forEach(value => {
        const i = options.valueFilters.findIndex(vf => vf.value === value)

        if (i > -1) {
          if (payload.type === null) {
            options.valueFilters.splice(i, 1)
          } else {
            options.valueFilters[i].type = payload.type
          }
        } else {
          options.valueFilters.push({ value, type: payload.type })
        }
      })
    }
  },

  filter: (ctx, column, options) => {
    let values = getColumnValue(ctx, column)

    const defaultResult = !options.valueFilters.some(({ type }) => type === ValueFilterType.Include)

    if (!Array.isArray(values)) {
      values = [values]
    }

    return _.chain(options.valueFilters)
      .reduce((acc, { type, value }) => {
        const result = values.reduce((acc2, columnValue) => {
          if (acc2 !== null) {
            return acc2
          }

          return VALUE_FILTER_FUNCTIONS[type](columnValue, value)
        }, null)

        if (result === null) {
          return acc
        }

        return acc === null ? result : acc && result
      }, null)
      .thru(result => (result === null ? defaultResult : result))
      .value()
  },
}
