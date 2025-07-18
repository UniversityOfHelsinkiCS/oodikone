import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

import { DateRangeSelector } from '@/components/common/DateRangeSelector'
import { getColumnValue } from '@/components/SortableTable/common'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

const DateColumnFilterComponent = ({ options, dispatch }) => {
  return (
    <div className="sortable-table-date-picker" style={{ padding: '0.5em 0.75em' }}>
      <DateRangeSelector
        onChange={range =>
          dispatch({
            type: 'SET_RANGE',
            payload: { range },
          })
        }
        showSemesters
        value={options?.range}
      />
    </div>
  )
}

export const dateColumnFilter = {
  component: DateColumnFilterComponent,

  isActive: options => options?.range?.[0] || options?.range?.[1],

  initialOptions: () => ({
    range: [null, null],
  }),

  reduce: (options, { type, payload }) => {
    if (type === 'SET_RANGE') {
      options.range = payload.range
    }
  },

  filter: (ctx, column, options) => {
    const value = getColumnValue(ctx, column)

    if (options?.range?.[0] && !dayjs(value).isSameOrAfter(options?.range?.[0])) {
      return false
    }

    if (options?.range?.[1] && !dayjs(value).isSameOrBefore(options?.range?.[1])) {
      return false
    }

    return true
  },
}
