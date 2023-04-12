import SortableTable from 'components/SortableTable'
import React, { useEffect, useState } from 'react'
import { useGetPrerequisiteTableQuery } from 'redux/prerequisiteSearch'
import { Icon, Loader } from 'semantic-ui-react'
import moment from 'moment'

const getColumns = courseCodes => {
  const isPassed = credit => [4, 7, 9].includes(credit)
  // 4=completed, 7=improved, 9=transferred, 10=failed

  const getCompletion = (student, courseCode, { icon }) => {
    const completion = student.credits.find(c => c.courseCode === courseCode && isPassed(c.creditType))
    const enrollment = student.enrollments.find(e => e.courseCode === courseCode)
    if (completion === undefined) {
      if (!enrollment) {
        return icon ? <Icon fitted name="times" color="red" /> : 'No completion'
      }
      return icon ? (
        <Icon fitted name="minus" color="grey" />
      ) : (
        `Latest enrollment: ${moment(enrollment.date).format('DD-MM-YYYY')}`
      )
    }

    return icon ? <Icon fitted name="check" color="green" /> : 'Passed'
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
      getRowVal: s => {
        return s.studentNumber
      },
      getRowContent: s => s.studentNumber,
    },
  ]

  const completionStatusColumns = courseCodes.map(courseCode => {
    return {
      key: courseCode,
      title: courseCode,
      cellProps: { style },
      headerProps: { title: courseCode },
      getRowVal: s => getCompletion(s, courseCode, { icon: false }),
      getRowContent: s => getCompletion(s, courseCode, { icon: true }),
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

  return [...studentNbrColumn, ...completionStatusColumns, statisticHeader]
}

const CompletedPrerequisitesResults = ({ searchValues }) => {
  const { courseList, studentList } = searchValues
  const [tableData, setData] = useState(null)
  const prerequisiteTable = useGetPrerequisiteTableQuery({ courseList, studentList })
  const isFetchingOrLoading = prerequisiteTable.isLoading || prerequisiteTable.isFetching
  const isError = prerequisiteTable.isError || (prerequisiteTable.isSuccess && !prerequisiteTable.data)

  useEffect(() => {
    if (!isError && !isFetchingOrLoading) {
      setImmediate(() => {
        const data = prerequisiteTable?.data
        setData(data)
      })
    }
  }, [prerequisiteTable])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || tableData === null) return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div style={{ maxWidth: '100vh', overflowX: 'auto' }} data-cy="prerequisite-table-div">
      <SortableTable
        title="Prerequisite search"
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
        columns={getColumns(tableData.courseCodes)}
        data={tableData.students}
      />
    </div>
  )
}

export default CompletedPrerequisitesResults
