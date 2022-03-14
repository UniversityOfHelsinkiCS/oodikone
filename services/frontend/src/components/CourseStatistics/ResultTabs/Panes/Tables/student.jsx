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

const getColumns = (showDetails, showEnrollments, userHasAccessToAllStats, alternatives, separate) => {
  const showPopulation = (yearcode, years) => {
    const queryObject = {
      from: yearcode,
      to: yearcode,
      coursecodes: JSON.stringify(uniq(alternatives)),
      years,
      separate,
    }
    const searchString = qs.stringify(queryObject)
    return `/coursepopulation?${searchString}`
  }

  const columns = [
    {
      key: 'TIME',
      title: 'Time',
      getRowVal: s => s.code,
      getRowExportVal: s => s.name,
      getRowContent: s => (
        <div style={{ whiteSpace: 'nowrap' }}>
          {s.name}
          {s.name === 'Total' && !userHasAccessToAllStats && <strong>*</strong>}
          {s.name !== 'Total' && userHasAccessToAllStats && (
            <Item as={Link} to={showPopulation(s.code, s.name, s)}>
              <Icon name="level up alternate" />
            </Item>
          )}
        </div>
      ),
      getCellProps: s => defineCellColor(s),
    },
    {
      key: 'TOTAL',
      title: 'Total Students',
      getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.students.total),
      getCellProps: s => defineCellColor(s),
    },
    {
      key: 'PASS_RATE',
      title: 'Pass-%',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.passRate),
      getRowContent: s => (s.rowObfuscated ? 'NA' : formatPercentage(s.students.passRate || 0)),
      getCellProps: s => defineCellColor(s),
    },
    {
      key: 'PASS_FIRST',
      title: 'On First Attempt',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.categories.passedFirst || 0),
      getCellProps: s => defineCellColor(s),
      headerProps: { style: { borderLeft: '0' } },
      onlyInDetailedView: true,
    },
    {
      key: 'PASS_EVENTUALLY',
      title: 'Eventually',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.categories.passedEventually || 0),
      getCellProps: s => defineCellColor(s),
      headerProps: { style: { borderLeft: '0' } },
      onlyInDetailedView: true,
    },
    {
      key: 'FAIL_RATE',
      title: 'Fail-%',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.failRate),
      getRowContent: s => (s.rowObfuscated ? 'NA' : formatPercentage(s.students.failRate || 0)),
      getCellProps: s => defineCellColor(s),
    },
    {
      key: 'NEVER PASSED',
      title: 'Yet to Pass',
      getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.categories.neverPassed || 0),
      getCellProps: s => defineCellColor(s),
      headerProps: { style: { borderLeft: '0' } },
      onlyInDetailedView: true,
    },
    {
      key: 'ENROLLMENTS',
      title: 'Total Enrollments',
      getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.totalEnrollments),
      getCellProps: s => defineCellColor(s),
      onlyInEnrollmentView: true,
    },
    {
      key: 'ENROLLMENTS_ENROLLED',
      title: 'Enrolled',
      getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.enrollmentsByState.ENROLLED) || 0,
      getCellProps: s => defineCellColor(s),
      onlyInEnrollmentView: true,
    },
    {
      key: 'ENROLLMENTS_MISSING_GRADE',
      title: 'Enrolled no grade',
      getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.enrolledStudentsWithNoGrade),
      getCellProps: s => defineCellColor(s),
      onlyInEnrollmentView: true,
    },
    {
      key: 'ENROLLMENTS_REJECTED',
      title: 'Rejected',
      getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.enrollmentsByState.REJECTED) || 0,
      getCellProps: s => defineCellColor(s),
      onlyInEnrollmentView: true,
    },
    {
      key: 'ENROLLMENTS_ABORTED',
      title: 'Aborted',
      getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.enrollmentsByState.ABORTED) || 0,
      getCellProps: s => defineCellColor(s),
      onlyInEnrollmentView: true,
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
  userHasAccessToAllStats,
  headerVisible = false,
}) => {
  const columns = useMemo(
    () => getColumns(showDetails, showEnrollments, userHasAccessToAllStats, alternatives, separate),
    [showDetails, showEnrollments, userHasAccessToAllStats, alternatives, separate]
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
