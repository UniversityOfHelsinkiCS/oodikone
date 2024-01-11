import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { Loader, Icon } from 'semantic-ui-react'

import { useGetOpenUniCourseStudentsQuery } from 'redux/openUniPopulations'
import { SortableTable } from 'components/SortableTable'
import { useLanguage } from 'components/LanguagePicker/useLanguage'

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
  const studentNbrColumn = [
    {
      key: 'studentnumber-parent',
      mergeHeader: true,
      // merge: true,
      title: 'Student Number',
      children: [
        {
          key: 'studentnumber-child',
          title: 'Student Number',
          cellProps: { style },
          getRowVal: s => s.studentnumber,
          getRowContent: s => s.studentnumber,
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
      getRowVal: s => s.totals.passed,
      getRowContent: s => s.totals.passed,
    },
    {
      key: 'failed',
      title: 'Failed',
      headerProps: { title: 'Failed' },
      getRowVal: s => s.totals.failed,
      getRowContent: s => s.totals.failed,
      cellProps: { style },
    },
    {
      key: 'unfinished',
      title: 'Unfinished',
      headerProps: { title: 'Unfinished' },
      getRowVal: s => s.totals.unfinished,
      getRowContent: s => s.totals.unfinished,
      cellProps: { style },
    },
  ]

  const informationColumns = [
    {
      key: 'email-child',
      title: 'Email',
      getRowVal: s => (s.email ? s.email : ''),
      getRowContent: s => (s.email ? s.email : ''),
      headerProps: { title: 'Email' },
    },
    {
      key: 'secondary_email-child',
      title: 'Secondary Email',
      getRowVal: s => (s.secondaryEmail ? s.secondaryEmail : ''),
      getRowContent: s => (s.secondaryEmail ? s.secondaryEmail : ''),
      headerProps: { title: 'Secondary Email' },
    },
  ]
  const findRowContent = (s, courseCode) => {
    if (s.courseInfo[courseCode] === undefined) return null
    if (s.courseInfo[courseCode].status.passed) return <Icon fitted name="check" color="green" />
    if (s.courseInfo[courseCode].status.failed) return <Icon fitted name="times" color="red" />
    if (s.courseInfo[courseCode].status.unfinished) return <Icon fitted name="minus" color="grey" />
    return null
  }

  const findRowValue = (s, courseCode, hidden = false) => {
    if (s.courseInfo[courseCode] === undefined) return ''
    if (s.courseInfo[courseCode].status.passed && hidden)
      return `Passed: ${moment(s.courseInfo[courseCode].status.passed).format('YYYY-MM-DD')}`
    if (s.courseInfo[courseCode].status.failed && hidden)
      return `Failed: ${moment(s.courseInfo[courseCode].status.failed).format('YYYY-MM-DD')}`
    if (s.courseInfo[courseCode].status.unfinished && hidden)
      return `Enrollment: ${moment(s.courseInfo[courseCode].status.unfinished).format('YYYY-MM-DD')}`
    if (s.courseInfo[courseCode].status.passed) return 'Passed'
    if (s.courseInfo[courseCode].status.failed) return 'Failed'
    if (s.courseInfo[courseCode].status.unfinished) return 'Unfinished'
    return ''
  }
  const findProp = (s, courseCode) => {
    const propObj = {
      title: '',
      style,
    }
    if (s.courseInfo[courseCode] === undefined) return propObj
    if (s.courseInfo[courseCode].status.passed)
      return { ...propObj, title: `Passed: ${moment(s.courseInfo[courseCode].status.passed).format('YYYY-MM-DD')}` }
    if (s.courseInfo[courseCode].status.failed)
      return { ...propObj, title: `Failed: ${moment(s.courseInfo[courseCode].status.failed).format('YYYY-MM-DD')}` }
    if (s.courseInfo[courseCode].status.unfinished)
      return {
        ...propObj,
        title: `Enrollment: ${moment(s.courseInfo[courseCode].status.unfinished).format('YYYY-MM-DD')}`,
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
    cellProps: s => findProp(s, course.label),
    headerProps: { title: `${course.label}-${getTextIn(course.name)}` },
    getRowVal: s => {
      return findRowValue(s, course.label)
    },
    getRowContent: s => {
      return findRowContent(s, course.label)
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
    getRowVal: s => {
      return findRowValue(s, course.label, true)
    },
    code: `hidden ${course.label}`,
  }))

  const columns = []
  columns.push(
    {
      key: 'general',
      title: <b>Labels:</b>,
      textTitle: null,
      children: studentNbrColumn,
    },
    {
      key: 'Courses',
      title: <b>Courses:</b>,
      textTitle: null,
      children: columnsToShow,
    },
    {
      key: 'statistics',
      title: <b>Total of:</b>,
      textTitle: null,
      children: statisticColumns,
    },
    {
      key: 'information',
      title: <b>Information:</b>,
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
      const unOrderedlabels = openUniStudentStats?.data.courses
      const labelsToCourses = [...unOrderedlabels].sort((a, b) => a.label.localeCompare(b.label))
      setImmediate(() => {
        const data = getTableData(openUniStudentStats?.data.students)
        const columns = getColumns(labelsToCourses, getTextIn)
        setData({ data, columns })
      })
    }
  }, [openUniStudentStats, language])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading) return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div style={{ paddingBottom: '50px' }}>
      <div style={{ maxHeight: '80vh', width: '100%' }} data-cy="open-uni-table-div">
        {courseList.length > 0 && (
          <SortableTable
            title={`Open Uni Student Population (${Object.keys(openUniStudentStats?.data.students).length} students)`}
            featureName="open_uni"
            columns={tableData.columns}
            data={tableData.data}
          />
        )}
      </div>
    </div>
  )
}
