import React, { useMemo } from 'react'
import SortableTable from '../../SortableTable'

const getColumns = () => {
  const columns = [
    {
      key: 'code',
      title: 'Code',
      getRowVal: course => course.code,
      getRowContent: course => course.code,
    },
    {
      key: 'name',
      title: 'Name',
      getRowVal: course => course.name.fi,
      getRowContent: course => course.name.fi,
    },
    {
      key: 'total',
      title: 'Total',
      getRowVal: course => course.total,
      getRowContent: course => course.total,
    },
  ]

  return columns
}

const OverallStatsTable = ({ data }) => {
  const columns = useMemo(() => getColumns(), [data])

  return (
    <div data-cy="CoursesSortableTable">
      <SortableTable
        title={`Student statistics for group `}
        defaultSort={['name', 'asc']}
        defaultdescending
        getRowKey={course => course.code}
        // tableProps={{ celled: true, fixed: true }}
        columns={columns}
        data={data}
      />
    </div>
  )
}

export default OverallStatsTable
