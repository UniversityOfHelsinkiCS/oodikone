import React, { useMemo } from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { Header, Icon, Item } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { uniq } from 'lodash'
import { string, object, arrayOf, bool } from 'prop-types'
import SortableTable from '../../../../SortableTable'
import { defineCellColor } from '../util'

const formatPercentage = p => `${(p * 100).toFixed(2)} %`

const getColumns = (showDetails, showEnrollments, userHasAccessToAllStats, alternatives, separate, unifyCourses) => {
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
          getRowVal: s => (s.name === 'Total' ? -1 : s.name),
          formatValue: v => (v === -1 ? 'Total' : v),
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
      title: showEnrollments ? 'Total Students' : 'Graded students',
      helpText: showEnrollments ? 'Total count of students, including enrolled students with no grade.' : null,
      cellProps: s => ({
        style: {
          textAlign: 'right',
          color: s.rowObfuscated ? 'gray' : 'inherit',
        },
      }),
      filterType: 'range',
      getRowVal: s => {
        if (s.rowObfuscated) return 5
        if (showEnrollments) return s.students.withEnrollments.total
        return s.students.total
      },
      getRowContent: s => {
        if (s.rowObfuscated) return '5 or less students'
        if (showEnrollments) return s.students.withEnrollments.total
        return s.students.total
      },
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
    },
    {
      key: 'ENROLLMENTS_MISSING_GRADE',
      title: 'Enrolled no grade',
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
      onlyInEnrollmentView: true,
    },
    {
      key: 'PASS_RATE',
      title: 'Pass-%',
      getRowVal: s => {
        if (s.rowObfuscated) return 0
        if (showEnrollments) return s.students.withEnrollments.passRate * 100
        return s.students.passRate * 100
      },
      getRowContent: s => {
        if (s.rowObfuscated) return '5 or less students'
        if (showEnrollments) return formatPercentage(s.students.withEnrollments.passRate)
        return formatPercentage(s.students.passRate)
      },
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
    if (showEnrollments && column.onlyInEnrollmentView) return true
    return !column.onlyInDetailedView && !column.onlyInEnrollmentView
  })
}

const StudentTable = ({
  data: { name, stats },
  settings: { showDetails, showEnrollments, separate },
  alternatives,
  unifyCourses,
  userHasAccessToAllStats,
  headerVisible = false,
}) => {
  const columns = useMemo(
    () => getColumns(showDetails, showEnrollments, userHasAccessToAllStats, alternatives, separate, unifyCourses),
    [showDetails, showEnrollments, userHasAccessToAllStats, alternatives, separate, unifyCourses]
  )

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
        getRowKey={s => s.code}
        tableProps={{ celled: true, fixed: true }}
        columns={columns}
        data={stats}
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
