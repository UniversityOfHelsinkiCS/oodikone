import React from 'react'
import moment from 'moment'
import { Loader, Icon } from 'semantic-ui-react'
import { useGetOpenUniCourseStudentsQuery } from 'redux/openUniPopulations'
import SortableTable from 'components/SortableTable'

const OpenUniPopulationResults = ({ courses }) => {
  const openUniStudentStats = useGetOpenUniCourseStudentsQuery({ courses })
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
          key: s => `studentnumber-${s.studentnumber}`,
          title: 'Student Number',
          cellProps: { title: 'student number' },
          getRowVal: s => s.studentnumber,
          getRowContent: s => s.studentnumber,
          child: true,
        },
      ],
    },
  ]

  const emailColumns = [
    {
      key: s => `email-${s.email}`,
      title: 'Email',
      getRowVal: s => (s.email ? s.email : ''),
      getRowContent: s => (s.email ? s.email : ''),
      cellProps: { title: 'Email' },
      child: true,
    },
    {
      key: s => `secondary_email-${s.secondaryEmail}`,
      title: 'Secondary Email',
      getRowVal: s => (s.secondaryEmail ? s.secondaryEmail : ''),
      getRowContent: s => (s.secondaryEmail ? s.secondaryEmail : ''),
      cellProps: { title: 'Secodary Email' },
      child: true,
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

  const labelsToCourses = courses.reduce((acc, course) => [...acc, { label: course }], [])
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
          title: `${course.label}`, // , ${getTextIn(m.name)}`
          style: {
            verticalAlign: 'middle',
            textAlign: 'center',
          },
        },
        headerProps: { title: `${course.label}` }, // ${getTextIn(m.name)}` },
        getRowVal: s => {
          return findRowValue(s, course.label)
        },
        getRowExportVal: s => {
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
      key: 'emails',
      title: <b>Email Adresses:</b>,
      textTitle: null,
      parent: true,
      children: emailColumns,
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
      },
    ],
    []
  )

  return (
    <div>
      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <div style={{ display: 'flex' }}>
          <div style={{ maxHeight: '80vh', width: '100%' }}>
            {courses.length > 0 && (
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
