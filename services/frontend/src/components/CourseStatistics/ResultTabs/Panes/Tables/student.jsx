import React, { useMemo } from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { Header, Icon, Item } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { uniq } from 'lodash'
import { string, object, arrayOf, bool } from 'prop-types'
import { row } from 'components/SortableTable'
import SortableTable from '../../../../SortableTable'
import { defineCellColor, resolveGrades, getSortableColumn } from '../util'

const formatPercentage = p => `${(p * 100).toFixed(2)} %`

const getGradeColumns = grades =>
  grades.map(({ key, title }) =>
    getSortableColumn({
      key,
      title,
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.grades[key] || 0),
      onlyInGradeView: true,
    })
  )

const getColumns = (stats, showDetails, showGrades, userHasAccessToAllStats, alternatives, separate, unifyCourses) => {
  const showPopulation = (yearcode, years) => {
    const queryObject = {
      from: yearcode,
      to: yearcode,
      coursecodes: JSON.stringify(uniq(alternatives)),
      years,
      separate,
      unifyCourses,
    }
    const searchString = qs.stringify(queryObject)
    return `/coursepopulation?${searchString}`
  }

  const columns = [
    {
      key: 'TIME-PARENT',
      merge: true,
      mergeHeader: true,
      children: [
        {
          key: 'TIME',
          title: 'Time',
          filterType: 'range',
          getRowVal: s => s.code + (2011 - 62),
          getRowExportVal: s => s.name,
          getRowContent: s => (
            <div style={{ whiteSpace: 'nowrap' }}>
              {s.name}
              {s.name === 'Total' && !userHasAccessToAllStats && <strong>*</strong>}
            </div>
          ),
        },
        {
          key: 'TIME-ICON',
          export: false,
          getRowContent: s => (
            <>
              {s.name !== 'Total' && userHasAccessToAllStats && (
                <Item as={Link} to={showPopulation(s.code, s.name, s)}>
                  <Icon name="level up alternate" />
                </Item>
              )}
            </>
          ),
        },
      ],
    },
    {
      key: 'TOTAL',
      title: 'Total\nStudents',
      helpText: 'Total count of students, including enrolled students with no grade.',
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 5 : s.students.withEnrollments.total),
      getRowContent: s => (s.rowObfuscated ? '5 or less students' : s.students.withEnrollments.total),
      getCellProps: s => defineCellColor(s),
    },
    {
      key: 'TOTAL_PASSED',
      title: 'Passed',
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.totalPassed || 0),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      hideWhenGradesVisible: true,
    },
    {
      key: 'TOTAL_FAILED',
      title: 'Failed',
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.totalFailed || 0),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      hideWhenGradesVisible: true,
    },
    ...getGradeColumns(resolveGrades(stats)),
    {
      key: 'ENROLLMENTS_MISSING_GRADE',
      title: 'Enrolled,\nno grade',
      filterType: 'range',
      helpText: 'Total count of students with a valid enrollment and no passing or failing grade.',
      getRowVal: s => (s.rowObfuscated ? 5 : s.students.enrolledStudentsWithNoGrade),
      getRowContent: s => (s.rowObfuscated ? '5 or less students' : s.students.enrolledStudentsWithNoGrade),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
    },
    {
      key: 'PASS_RATE',
      title: 'Pass-%',
      getRowVal: s => (s.rowObfuscated ? 0 : s.students.withEnrollments.passRate * 100),
      getRowContent: s =>
        s.rowObfuscated ? '5 or less students' : formatPercentage(s.students.withEnrollments.passRate),
      filterType: 'range',
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
    },
    {
      key: 'PASS_FIRST',
      title: 'On First Attempt',
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.categories.passedFirst || 0),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      onlyInDetailedView: true,
    },
    {
      key: 'PASS_EVENTUALLY',
      title: 'Eventually',
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.categories.passedEventually || 0),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      onlyInDetailedView: true,
    },
    {
      key: 'FAIL_RATE',
      title: 'Fail-%',
      filterType: 'range',
      getRowVal: s => (s.rowObfuscated ? 'NA' : (s.students.failRate || 0) * 100),
      getRowContent: s => (s.rowObfuscated ? 'NA' : formatPercentage(s.students.failRate || 0)),
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      onlyInDetailedView: true,
    },
  ]

  return columns.filter(column => {
    if (showDetails && column.onlyInDetailedView) return true
    if (showGrades && column.onlyInGradeView) return true
    if (showGrades && column.hideWhenGradesVisible) return false
    return !column.onlyInDetailedView && !column.onlyInGradeView
  })
}

const StudentTable = ({
  data: { name, stats },
  settings: { showDetails, separate, showGrades },
  alternatives,
  unifyCourses,
  userHasAccessToAllStats,
  headerVisible = false,
}) => {
  const columns = useMemo(
    () => getColumns(stats, showDetails, showGrades, userHasAccessToAllStats, alternatives, separate, unifyCourses),
    [stats, showDetails, showGrades, userHasAccessToAllStats, alternatives, separate, unifyCourses]
  )

  const data = stats.map(stats => {
    if (stats.name === 'Total') {
      return row(stats, { ignoreFilters: true })
    }

    return stats
  })

  return (
    <div>
      {headerVisible && (
        <Header as="h3" textAlign="center">
          {name}
        </Header>
      )}
      <SortableTable
        title={`Student statistics for group ${name}`}
        defaultSort={['TIME', 'desc']}
        defaultdescending
        tableProps={{ celled: true, fixed: true }}
        columns={columns}
        data={data}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are NOT included in the total</span>
      )}
    </div>
  )
}

StudentTable.propTypes = {
  data: object.isRequired,
  alternatives: arrayOf(string).isRequired,
  separate: bool,
  userHasAccessToAllStats: bool.isRequired,
}

StudentTable.defaultProps = {
  separate: false,
}

export default connect(null)(StudentTable)
