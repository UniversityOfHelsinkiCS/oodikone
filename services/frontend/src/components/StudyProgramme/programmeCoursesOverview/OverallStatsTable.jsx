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
      key: 'totalAll',
      title: 'All students',
      getRowVal: course => course.totalAll,
      getRowContent: course => course.totalAll,
    },
    {
      key: 'totalOwn',
      title: 'Current programme student',
      getRowVal: course => course.totalOwn,
      getRowContent: course => course.totalOwn,
    },
  ]

  return columns
}

const OverallStatsTable = ({ data }) => {
  const columns = useMemo(() => getColumns(), [data])

  return (
    <div data-cy="CoursesSortableTable">
      <SortableTable
        title={`Student statistics for studyprogramme courses `}
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
