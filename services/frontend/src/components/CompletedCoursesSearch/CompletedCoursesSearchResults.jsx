import moment from 'moment'
import React from 'react'
import { Icon, Loader } from 'semantic-ui-react'

import { hiddenNameAndEmailForExcel } from '@/common/columns'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { RightsNotification } from '@/components/RightsNotification'
import { SortableTable } from '@/components/SortableTable'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { useGetCompletedCoursesQuery } from '@/redux/completedCoursesSearch'

const getColumns = (courses, showStudentNames, getTextIn) => {
  const isPassed = credit => [4, 7, 9].includes(credit)
  // 4=completed, 7=improved, 9=transferred, 10=failed

  const getCompletion = (student, courseCode, { icon }) => {
    const completion = student.credits.find(credit => credit.courseCode === courseCode && isPassed(credit.creditType))
    const enrollment = student.enrollments[courseCode]
    if (completion === undefined) {
      if (!enrollment) {
        return icon ? null : ''
      }
      if (icon) {
        if (moment(enrollment.date) > moment().subtract(6, 'months')) {
          return <Icon color="yellow" fitted name="minus" />
        }
        return <Icon color="grey" fitted name="minus" />
      }

      return `Latest enrollment: ${moment(enrollment.date).format('YYYY-MM-DD')}`
    }

    const substitutionString = completion.substitution ? ` as ${completion.substitution}` : ''

    return icon ? <Icon color="green" fitted name="check" /> : `Passed${substitutionString}`
  }

  const getTotalPassed = student => student.credits.filter(credit => isPassed(credit.creditType)).length

  const getTotalUnfinished = student => Object.values(student.enrollments).length

  const style = {
    verticalAlign: 'middle',
    textAlign: 'center',
  }

  const studentNbrColumn = [
    {
      key: 'studentnumber',
      title: 'Student number',
      cellProps: { style },
      getRowVal: student => student.studentNumber,
      getRowContent: student => <StudentInfoItem showSisuLink student={student} view="Completed courses search tool" />,
    },
  ]

  const getCellProps = (student, courseCode) => {
    const credit = student.credits.find(credit => credit.courseCode === courseCode)
    const enrollment = student.enrollments[courseCode]
    if (!credit && !enrollment) {
      return { style }
    }
    const title = credit
      ? `Passed on ${moment(credit.date).format('YYYY-MM-DD')}\nCourse code: ${
          credit.substitution ? credit.substitution : credit.courseCode
        }`
      : `Last enrollment on ${moment(enrollment.date).format('YYYY-MM-DD')}\nCourse code ${
          enrollment.substitution ? enrollment.substitution : enrollment.courseCode
        }`
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
      cellProps: student => getCellProps(student, course.code),
      headerProps: { title: course.code },
      getRowVal: student => getCompletion(student, course.code, { icon: false }),
      getRowContent: student => getCompletion(student, course.code, { icon: true }),
    }
  })

  const statisticColumns = [
    {
      key: 'passed',
      title: 'Passed',
      cellProps: { style },
      headerProps: { title: 'Passed' },
      getRowVal: student => getTotalPassed(student),
    },
    {
      key: 'unfinished',
      title: 'Unfinished',
      headerProps: { title: 'Unfinished' },
      getRowVal: student => getTotalUnfinished(student),
      cellProps: { style },
    },
  ]

  const statisticHeader = {
    key: 'statistics',
    title: <b>Totals:</b>,
    export: false,
    textTitle: null,
    children: statisticColumns,
  }

  const emailColumn = showStudentNames
    ? [
        {
          key: 'email',
          title: 'Email',
          cellProps: { style },
          headerProps: { title: 'Email' },
          getRowVal: student => (student.email ? student.email : ''),
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
          getRowVal: student => student.lastname,
          export: false,
        },
        {
          key: 'firstnames',
          title: 'First names',
          cellProps: { style },
          getRowVal: student => student.firstnames,
          export: false,
        },
      ]
    : []

  return [...nameColumns, ...studentNbrColumn, ...completionStatusColumns, statisticHeader, ...emailColumn]
}

export const CompletedCoursesSearchResults = ({ searchValues }) => {
  const { courseList, studentList } = searchValues
  const showStudentNames = useStudentNameVisibility()
  const { data, isLoading, isFetching, isError } = useGetCompletedCoursesQuery({ courseList, studentList })
  const { getTextIn } = useLanguage()

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetching || isLoading || !data) return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div>
      <StudentNameVisibilityToggle />
      {data.discardedStudentNumbers?.length > 0 && (
        <RightsNotification discardedStudentNumbers={data.discardedStudentNumbers} />
      )}
      <div
        data-cy="completed-courses-table-div"
        style={{ maxWidth: '100vh', overflowX: 'auto', paddingBottom: '50px', padding: '0.5em' }}
      >
        <SortableTable
          columns={getColumns(data.courses, showStudentNames.visible, getTextIn)}
          data={data.students}
          featureName="completed_courses"
          onlyExportColumns={hiddenNameAndEmailForExcel}
          title="Completed courses search"
        />
      </div>
    </div>
  )
}
