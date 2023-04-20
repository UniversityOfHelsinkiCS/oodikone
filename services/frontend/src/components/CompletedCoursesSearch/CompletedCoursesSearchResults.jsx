import SortableTable from 'components/SortableTable'
import React, { useEffect, useState } from 'react'
import { useGetCompletedCoursesQuery } from 'redux/completedCoursesSearch'
import { Icon, Loader } from 'semantic-ui-react'
import moment from 'moment'
import StudentNameVisibilityToggle, { useStudentNameVisibility } from 'components/StudentNameVisibilityToggle'
import useLanguage from 'components/LanguagePicker/useLanguage'
import RightsNotification from 'components/RightsNotification'

const getColumns = (courses, showStudentNames, getTextIn) => {
  const isPassed = credit => [4, 7, 9].includes(credit)
  // 4=completed, 7=improved, 9=transferred, 10=failed

  const getCompletion = (student, courseCode, { icon }) => {
    const completion = student.credits.find(c => c.courseCode === courseCode && isPassed(c.creditType))
    const enrollment = student.enrollments.find(e => e.courseCode === courseCode)
    if (completion === undefined) {
      if (!enrollment) {
        return icon ? null : ''
      }
      if (icon) {
        if (moment(enrollment.date) > moment().subtract(6, 'months')) {
          return <Icon fitted name="minus" color="yellow" />
        }
        return <Icon fitted name="minus" color="grey" />
      }

      return `Latest enrollment: ${moment(enrollment.date).format('YYYY-MM-DD')}`
    }

    const substitutionString = completion.substitution ? ` as ${completion.substitution}` : ''

    return icon ? <Icon fitted name="check" color="green" /> : `Passed${substitutionString}`
  }

  const getTotalPassed = s => s.credits.filter(c => isPassed(c.creditType)).length

  const getTotalUnfinished = student => student.enrollments.length

  const style = {
    verticalAlign: 'middle',
    textAlign: 'center',
  }

  const studentNbrColumn = [
    {
      key: 'studentnumber',
      title: 'Student Number',
      cellProps: { style },
      getRowVal: s => s.studentNumber,
      getRowContent: s => s.studentNumber,
    },
  ]

  const getCellProps = (student, courseCode) => {
    const creditDate = student.credits.find(credit => credit.courseCode === courseCode)?.date
    const enrollmentDate = student.enrollments.find(enrollment => enrollment.courseCode === courseCode)?.date
    if (!creditDate && !enrollmentDate) {
      return { style }
    }
    const title = creditDate
      ? `Passed on ${moment(creditDate).format('YYYY-MM-DD')} `
      : `Last enrollment on ${moment(enrollmentDate).format('YYYY-MM-DD')} `
    return { style, title }
  }

  const completionStatusColumns = courses.map(course => {
    return {
      key: course.code,
      title: (
        <div key={course.code} style={{ marginLeft: '-6px', width: '8em', whiteSpace: 'normal' }}>
          <div key={`key1${course.code}`}>{course.code}</div>
          <div key={`key2${course.code}`} style={{ color: 'gray', fontWeight: 'normal' }}>
            {getTextIn(course.name)}
          </div>
        </div>
      ),
      textTitle: course.code,
      cellProps: s => getCellProps(s, course.code),
      headerProps: { title: course.code },
      getRowVal: s => getCompletion(s, course.code, { icon: false }),
      getRowContent: s => getCompletion(s, course.code, { icon: true }),
    }
  })

  const statisticColumns = [
    {
      key: 'passed',
      title: 'Passed',
      cellProps: { style },
      headerProps: { title: 'Passed' },
      getRowVal: s => getTotalPassed(s),
      getRowContent: s => getTotalPassed(s),
      child: true,
    },
    {
      key: 'unfinished',
      title: 'Unfinished',
      headerProps: { title: 'Unfinished' },
      getRowVal: s => getTotalUnfinished(s),
      getRowContent: s => getTotalUnfinished(s),
      cellProps: { style },
      child: true,
    },
  ]

  const statisticHeader = {
    key: 'statistics',
    title: <b>Totals:</b>,
    textTitle: null,
    parent: true,
    children: statisticColumns,
  }

  const infoColumnsForCsv = [
    {
      key: 'hidden-lastname',
      title: 'Last name',
      forceToolsMode: 'none',
      getRowVal: s => s.lastName,
      headerProps: { style: { display: 'none' } },
      cellProps: { style: { display: 'none' } },
      export: true,
    },
    {
      key: 'hidden-firstnames',
      title: 'First names',
      getRowVal: s => s.firstNames,
      forceToolsMode: 'none',
      headerProps: { style: { display: 'none' } },
      cellProps: { style: { display: 'none' } },
      export: true,
    },
    {
      key: 'hidden-email',
      title: 'E-mail',
      getRowVal: s => (s.email ? s.email : ''),
      forceToolsMode: 'none',
      headerProps: { style: { display: 'none' } },
      cellProps: { style: { display: 'none' } },
      export: true,
    },
  ]

  const emailColumn = showStudentNames
    ? [
        {
          key: 'email',
          title: 'Email',
          cellProps: { style },
          headerProps: { title: 'Email' },
          getRowVal: s => (s.email ? s.email : ''),
          getRowContent: s => (s.email ? s.email : ''),
          child: true,
          export: false,
        },
      ]
    : []

  const nameColumns = showStudentNames
    ? [
        {
          key: 'lastname',
          title: 'Last name',
          cellProps: { style },
          getRowVal: s => s.lastName,
          getRowContent: s => s.lastName,
          export: false,
        },
        {
          key: 'firstnames',
          title: 'First names',
          cellProps: { style },
          getRowVal: s => s.firstNames,
          getRowContent: s => s.firstNames,
          export: false,
        },
      ]
    : []

  const hiddenParentColumn = {
    key: 'hiddenFiles',
    title: '',
    mergeHeader: true,
    textTitle: null,
    parent: true,
    children: infoColumnsForCsv,
  }

  return [
    hiddenParentColumn,
    ...nameColumns,
    ...studentNbrColumn,
    ...completionStatusColumns,
    statisticHeader,
    ...emailColumn,
  ]
}

const CompletedCoursesSearchResults = ({ searchValues }) => {
  const { courseList, studentList } = searchValues
  const [data, setData] = useState(null)
  const showStudentNames = useStudentNameVisibility()
  const completedCoursesTable = useGetCompletedCoursesQuery({ courseList, studentList })
  const isFetchingOrLoading = completedCoursesTable.isLoading || completedCoursesTable.isFetching
  const isError = completedCoursesTable.isError || (completedCoursesTable.isSuccess && !completedCoursesTable.data)
  const { getTextIn } = useLanguage()

  useEffect(() => {
    if (!isError && !isFetchingOrLoading) {
      setImmediate(() => {
        const data = completedCoursesTable?.data
        setData(data)
      })
    }
  }, [completedCoursesTable])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || data === null) return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div>
      <StudentNameVisibilityToggle />
      {data.forbiddenStudents?.length > 0 && <RightsNotification studentNumbers={data.forbiddenStudents} />}
      <div
        style={{ maxWidth: '100vh', overflowX: 'auto', paddingBottom: '50px' }}
        data-cy="completed-courses-table-div"
      >
        <SortableTable
          title="Completed courses search"
          getRowKey={s => s.studentNumber}
          tableProps={{
            celled: true,
            compact: 'very',
            padded: false,
            collapsing: true,
            basic: true,
            striped: true,
            singleLine: true,
            textAlign: 'center',
          }}
          columns={getColumns(data.courses, showStudentNames.visible, getTextIn)}
          data={data.students}
        />
      </div>
    </div>
  )
}

export default CompletedCoursesSearchResults
