import React from 'react'
import useLanguage from '../../LanguagePicker/useLanguage'
import SortableTable from '../../SortableTable'

const getColumns = language => {
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
      getRowVal: course => course.name[language],
      getRowContent: course => course.name[language],
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
  const { language } = useLanguage()
  return (
    <div data-cy="CoursesSortableTable">
      <SortableTable
        title={`Student statistics for studyprogramme courses `}
        defaultSort={['name', 'asc']}
        defaultdescending
        getRowKey={course => course.code}
        // tableProps={{ celled: true, fixed: true }}
        columns={getColumns(language)}
        data={data}
      />
    </div>
  )
}

export default OverallStatsTable
