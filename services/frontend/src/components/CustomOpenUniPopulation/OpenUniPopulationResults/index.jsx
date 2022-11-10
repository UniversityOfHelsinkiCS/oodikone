import React from 'react'
import moment from 'moment'
import { Loader, Icon } from 'semantic-ui-react'
import { useGetOpenUniCourseStudentsQuery } from 'redux/openUniPopulations'
import SortableTable from 'components/SortableTable'

const OpenUniPopulationResults = ({ fieldValues }) => {
  const { courseList, startdate, enddate } = fieldValues
  const openUniStudentStats = useGetOpenUniCourseStudentsQuery({ courseList, startdate, enddate })
  const isFetchingOrLoading = openUniStudentStats.isLoading || openUniStudentStats.isFetching
  const isError = openUniStudentStats.isError || (openUniStudentStats.isSuccess && !openUniStudentStats.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading) return <Loader active style={{ marginTop: '15em' }} />
  // const { getTextIn } = useLanguage()

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
          cellProps: {
            style: {
              verticalAlign: 'middle',
              textAlign: 'center',
            },
          },
          getRowVal: s => s.studentnumber,
          getRowContent: s => s.studentnumber,
          child: true,
        },
      ],
    },
  ]

  const statisticColumns = [
    {
      key: 'passed',
      title: 'Passed',
      cellProps: {
        style: {
          verticalAlign: 'middle',
          textAlign: 'center',
        },
      },
      headerProps: { title: 'Passed' },
      getRowVal: s => s.passedTotal,
      getRowContent: s => s.passedTotal,
      child: true,
    },
    {
      key: 'unfinished',
      title: 'Unfinished',
      headerProps: { title: 'Unfinished' },
      getRowVal: s => s.enrolledTotal,
      getRowContent: s => s.enrolledTotal,
      cellProps: {
        style: {
          verticalAlign: 'middle',
          textAlign: 'center',
        },
      },
      child: true,
    },
  ]

  const informationColumns = [
    {
      key: 'email-child',
      title: 'Email',
      getRowVal: s => (s.email ? s.email : ''),
      getRowContent: s => (s.email ? s.email : ''),
      headerProps: { title: 'Email' },
      child: true,
    },
    {
      key: 'secondary_email-child',
      title: 'Secondary Email',
      getRowVal: s => (s.secondaryEmail ? s.secondaryEmail : ''),
      getRowContent: s => (s.secondaryEmail ? s.secondaryEmail : ''),
      headerProps: { title: 'Secondary Email' },
      child: true,
    },
    {
      key: 'disseminationInfoAllowed',
      title: 'Marketing allowed',
      getRowVal: s => (s.disseminationInfoAllowed ? 'yes' : 'no'),
      getRowContent: s => (s.disseminationInfoAllowed ? 'yes' : 'no'),
      headerProps: { title: 'Marketing allowed' },
      child: true,
      cellProps: {
        style: {
          verticalAlign: 'middle',
          textAlign: 'center',
        },
      },
    },
  ]
  const findRowContent = (s, courseCode) => {
    if (s.courseInfo[courseCode] === undefined) return null
    if (s.courseInfo[courseCode].notEnrolled) return null
    if (s.courseInfo[courseCode].enrolledNotPassed.length > 0) return <Icon fitted name="times" color="red" />
    if (s.courseInfo[courseCode].enrolledPassed !== null) return <Icon fitted name="check" color="green" />
    return null
  }

  const findRowValue = (s, courseCode) => {
    if (s.courseInfo[courseCode] === undefined) return ''
    if (s.courseInfo[courseCode].notEnrolled) return ''
    if (s.courseInfo[courseCode].enrolledNotPassed.length > 0)
      return s.courseInfo[courseCode].enrolledNotPassed
        .map((dat, idx) => `Enrollment ${idx + 1}: ${moment(dat).format('DD-MM-YYYY')}`)
        .join(' ')
    if (s.courseInfo[courseCode].enrolledPassed !== null)
      return `Passed: ${moment(s.courseInfo[courseCode].enrolledPassed).format('DD-MM-YYYY')}`
    return ''
  }

  const labelsToCourses = courseList.reduce((acc, course) => [...acc, { label: course }], [])
  const columns = []

  columns.push(
    {
      key: 'general',
      title: <b>Labels:</b>,
      textTitle: null,
      parent: true,
      children: studentNbrColumn,
    },
    {
      key: 'Courses',
      title: <b>Fetched Courses:</b>,
      textTitle: null,
      parent: true,
      children: labelsToCourses.map(course => ({
        key: `${course.label}-child`,
        title: (
          <div style={{ maxWidth: '15em', whiteSpace: 'normal', overflow: 'hidden', width: 'max-content' }}>
            <div>{course.label}</div>
            {/* <div style={{ color: 'gray', fontWeight: 'normal' }}>{getTextIn(m.name)}</div> */}
          </div>
        ),
        textTitle: course.label,
        vertical: false,
        forceToolsMode: 'dangling',
        cellProps: {
          style: {
            verticalAlign: 'middle',
            textAlign: 'center',
          },
        },
        headerProps: { title: `${course.label}` }, // ${getTextIn(m.name)}` },
        getRowVal: s => {
          return findRowValue(s, course.label)
        },
        getRowContent: s => {
          return findRowContent(s, course.label)
        },
        child: true,
        childOf: course.label,
        code: course.label,
      })),
    },
    {
      key: 'statistics',
      title: <b>Total of:</b>,
      textTitle: null,
      parent: true,
      children: statisticColumns,
    },
    {
      key: 'information',
      title: <b>Information:</b>,
      textTitle: null,
      parent: true,
      children: informationColumns,
    }
  )

  const data = Object.keys(openUniStudentStats?.data).reduce(
    (acc, student) => [
      ...acc,
      {
        studentnumber: student,
        courseInfo: { ...openUniStudentStats?.data[student].courseInfo },
        email: openUniStudentStats?.data[student].email,
        secondaryEmail: openUniStudentStats?.data[student].secondaryEmail,
        disseminationInfoAllowed: openUniStudentStats?.data[student].disseminationInfoAllowed,
        enrolledTotal: openUniStudentStats?.data[student].enrolledTotal,
        passedTotal: openUniStudentStats?.data[student].passedTotal,
      },
    ],
    []
  )

  return (
    <div style={{ paddingBottom: '50px' }}>
      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <div style={{ display: 'flex', paddingBottom: '10px' }}>
          <div style={{ maxHeight: '80vh', width: '100%' }}>
            {courseList.length > 0 && (
              <SortableTable
                title="Students Open Uni"
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
                columns={columns}
                data={data}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OpenUniPopulationResults
