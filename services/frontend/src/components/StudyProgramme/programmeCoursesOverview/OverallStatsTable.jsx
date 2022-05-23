import React from 'react'
import useLanguage from '../../LanguagePicker/useLanguage'
import SortableTable from '../../SortableTable'

const getColumns = (language, showStudents) => {
  let columns = null
  if (showStudents) {
    columns = [
      {
        key: 'code',
        title: 'Code ',
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
        key: 'totalAllStudents',
        title: 'All students',
        getRowVal: course => course.totalAllStudents,
        getRowContent: course => course.totalAllStudents,
      },

      {
        key: 'totalProgrammeStudents',
        title: 'Programme students',
        getRowVal: course => course.totalProgrammeStudents,
        getRowContent: course => course.totalProgrammeStudents,
      },

      {
        key: 'totalWithoutStudyrightStudents',
        title: 'Open students',
        getRowVal: course => course.totalWithoutStudyrightStudents,
        getRowContent: course => course.totalWithoutStudyrightStudents,
      },

      {
        key: 'totalOtherProgrammeStudents',
        title: 'Other programme students',
        getRowVal: course => course.totalOtherProgrammeStudents,
        getRowContent: course => course.totalOtherProgrammeStudents,
      },
    ]
  } else {
    columns = [
      {
        key: 'code',
        title: 'Code ',
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
        key: 'totalAllCredits',
        title: 'All credits',
        getRowVal: course => course.totalAllCredits,
        getRowContent: course => course.totalAllCredits,
      },
      {
        key: 'totalProgrammeCredits',
        title: 'Programme credits',
        getRowVal: course => course.totalProgrammecredits,
        getRowContent: course => course.totalProgrammeCredits,
      },
      {
        key: 'totalWithoutStudyrightCredits',
        title: 'Open credits',
        getRowVal: course => course.totalWithoutStudyrightCredits,
        getRowContent: course => course.totalWithoutStudyrightCredits,
      },
      {
        key: 'totalOtherProgrammeCredits',
        title: 'Other programme credits',
        getRowVal: course => course.totalOtherProgrammeCredits,
        getRowContent: course => course.totalOtherProgrammeCredits,
      },
    ]
  }

  return columns
}

const OverallStatsTable = ({ data, showStudents }) => {
  const { language } = useLanguage()
  return (
    <div data-cy="CoursesSortableTable">
      <SortableTable
        title={`Student statistics for studyprogramme courses `}
        defaultSort={['name', 'asc']}
        defaultdescending
        getRowKey={course => course.code}
        // tableProps={{ celled: true, fixed: true }}
        columns={getColumns(language, showStudents)}
        data={data}
      />
    </div>
  )
}

export default OverallStatsTable
