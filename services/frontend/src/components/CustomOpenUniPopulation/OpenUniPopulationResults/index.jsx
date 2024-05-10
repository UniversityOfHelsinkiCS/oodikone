import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { Loader, Icon } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { useGetOpenUniCourseStudentsQuery } from '@/redux/openUniPopulations'

const getTableData = studentsData => {
  return Object.keys(studentsData).reduce(
    (acc, student) => [
      ...acc,
      {
        studentnumber: student,
        courseInfo: { ...studentsData[student].courseInfo },
        email: studentsData[student].email,
        secondaryEmail: studentsData[student].secondaryEmail,
        totals: studentsData[student].totals,
      },
    ],
    []
  )
}

const getColumns = (labelsToCourses, getTextIn) => {
  const style = {
    verticalAlign: 'middle',
    textAlign: 'center',
  }

  const studentNumberColumn = [
    {
      key: 'studentnumber-parent',
      mergeHeader: true,
      title: 'Student number',
      children: [
        {
          key: 'studentnumber-child',
          title: 'Student number',
          cellProps: { style },
          getRowVal: student => student.studentnumber,
          getRowContent: student => student.studentnumber,
        },
      ],
    },
  ]

  const statisticColumns = [
    {
      key: 'passed',
      title: 'Passed',
      cellProps: { style },
      headerProps: { title: 'Passed' },
      getRowVal: student => student.totals.passed,
    },
    {
      key: 'failed',
      title: 'Failed',
      headerProps: { title: 'Failed' },
      getRowVal: student => student.totals.failed,
      cellProps: { style },
    },
    {
      key: 'unfinished',
      title: 'Unfinished',
      headerProps: { title: 'Unfinished' },
      getRowVal: student => student.totals.unfinished,
      cellProps: { style },
    },
  ]

  const informationColumns = [
    {
      key: 'email-child',
      title: 'Email',
      getRowVal: student => (student.email ? student.email : ''),
      headerProps: { title: 'Email' },
    },
    {
      key: 'secondary_email-child',
      title: 'Secondary email',
      getRowVal: student => (student.secondaryEmail ? student.secondaryEmail : ''),
      headerProps: { title: 'Secondary Email' },
    },
  ]

  const findRowContent = (student, courseCode) => {
    if (student.courseInfo[courseCode] === undefined) return null
    if (student.courseInfo[courseCode].status.passed) return <Icon color="green" fitted name="check" />
    if (student.courseInfo[courseCode].status.failed) return <Icon color="red" fitted name="times" />
    if (student.courseInfo[courseCode].status.unfinished) return <Icon color="grey" fitted name="minus" />
    return null
  }

  const findRowValue = (student, courseCode, hidden = false) => {
    if (student.courseInfo[courseCode] === undefined) return ''
    if (student.courseInfo[courseCode].status.passed && hidden) {
      return `Passed: ${moment(student.courseInfo[courseCode].status.passed).format('YYYY-MM-DD')}`
    }
    if (student.courseInfo[courseCode].status.failed && hidden) {
      return `Failed: ${moment(student.courseInfo[courseCode].status.failed).format('YYYY-MM-DD')}`
    }
    if (student.courseInfo[courseCode].status.unfinished && hidden) {
      return `Enrollment: ${moment(student.courseInfo[courseCode].status.unfinished).format('YYYY-MM-DD')}`
    }
    if (student.courseInfo[courseCode].status.passed) return 'Passed'
    if (student.courseInfo[courseCode].status.failed) return 'Failed'
    if (student.courseInfo[courseCode].status.unfinished) return 'Unfinished'
    return ''
  }
  const findProp = (student, courseCode) => {
    const propObj = {
      title: '',
      style,
    }
    if (student.courseInfo[courseCode] === undefined) return propObj
    if (student.courseInfo[courseCode].status.passed)
      return {
        ...propObj,
        title: `Passed: ${moment(student.courseInfo[courseCode].status.passed).format('YYYY-MM-DD')}`,
      }
    if (student.courseInfo[courseCode].status.failed)
      return {
        ...propObj,
        title: `Failed: ${moment(student.courseInfo[courseCode].status.failed).format('YYYY-MM-DD')}`,
      }
    if (student.courseInfo[courseCode].status.unfinished)
      return {
        ...propObj,
        title: `Enrollment: ${moment(student.courseInfo[courseCode].status.unfinished).format('YYYY-MM-DD')}`,
      }
    return propObj
  }

  const columnsToShow = labelsToCourses.map(course => ({
    key: `${course.label}-${getTextIn(course.name)}`,
    title: (
      <div style={{ maxWidth: '15em', whiteSpace: 'normal', overflow: 'hidden', width: 'max-content' }}>
        <div>{course.label}</div>
      </div>
    ),
    textTitle: `${course.label}-${getTextIn(course.name)}`,
    vertical: false,
    forceToolsMode: 'dangling',
    cellProps: student => findProp(student, course.label),
    headerProps: { title: `${course.label}-${getTextIn(course.name)}` },
    getRowVal: student => {
      return findRowValue(student, course.label)
    },
    getRowContent: student => {
      return findRowContent(student, course.label)
    },
    code: course.label,
  }))

  const columnsToHide = labelsToCourses.map(course => ({
    key: `hidden-${course.label}-${getTextIn(course.name)}`,
    export: true,
    displayColumn: false,
    textTitle: `Dates-${course.label}-${getTextIn(course.name)}`,
    headerProps: {
      title: `Dates-${course.label}-${getTextIn(course.name)}`,
    },
    getRowVal: student => {
      return findRowValue(student, course.label, true)
    },
    code: `hidden ${course.label}`,
  }))

  const columns = []
  columns.push(
    {
      key: 'general',
      title: <b>Labels</b>,
      textTitle: null,
      children: studentNumberColumn,
    },
    {
      key: 'courses',
      title: <b>Courses</b>,
      textTitle: null,
      children: columnsToShow,
    },
    {
      key: 'statistics',
      title: <b>Total of</b>,
      textTitle: null,
      children: statisticColumns,
    },
    {
      key: 'information',
      title: <b>Information</b>,
      textTitle: null,
      children: informationColumns,
    }
  )
  if (labelsToCourses.length > 0) {
    columns.push({
      key: 'hiddencourses',
      title: '',
      mergeHeader: true,
      textTitle: null,
      children: columnsToHide,
    })
  }
  return columns
}

export const OpenUniPopulationResults = ({ fieldValues }) => {
  const { courseList, startdate, enddate } = fieldValues
  const [tableData, setData] = useState({ data: [], columns: [] })
  const { getTextIn, language } = useLanguage()
  const openUniStudentStats = useGetOpenUniCourseStudentsQuery({ courseList, startdate, enddate })
  const isFetchingOrLoading = openUniStudentStats.isLoading || openUniStudentStats.isFetching
  const isError = openUniStudentStats.isError || (openUniStudentStats.isSuccess && !openUniStudentStats.data)

  useEffect(() => {
    if (!isError && !isFetchingOrLoading) {
      const unOrderedLabels = openUniStudentStats?.data.courses
      const labelsToCourses = [...unOrderedLabels].sort((a, b) => a.label.localeCompare(b.label))

      const timer = setTimeout(() => {
        const data = getTableData(openUniStudentStats?.data.students)
        const columns = getColumns(labelsToCourses, getTextIn)
        setData({ data, columns })
      }, 0)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [openUniStudentStats, language])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading) return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div style={{ paddingBottom: '50px' }}>
      <div data-cy="open-uni-table-div" style={{ maxHeight: '80vh', width: '100%' }}>
        {courseList.length > 0 && (
          <SortableTable
            columns={tableData.columns}
            data={tableData.data}
            featureName="open_uni"
            title={`Open uni student population (${Object.keys(openUniStudentStats?.data.students).length} students)`}
          />
        )}
      </div>
    </div>
  )
}
