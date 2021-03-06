import React from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { Header, Icon, Item } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { uniq } from 'lodash'
import { shape, string, number, oneOfType, arrayOf, bool } from 'prop-types'
import SortableTable from '../../../../SortableTable'
import { defineCellColor } from '../util'

const formatPercentage = p => `${(p * 100).toFixed(2)} %`

const StudentTable = ({ stats, name, alternatives, separate, userHasAccessToAllStats, headerVisible = false }) => {
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

  return (
    <div>
      {headerVisible && (
        <Header as="h3" textAlign="center">
          {name}
        </Header>
      )}
      <SortableTable
        defaultdescending
        getRowKey={s => s.code}
        tableProps={{ celled: true, structured: true }}
        columns={[
          {
            key: 'TIME',
            title: 'Time',
            getRowVal: s => s.code,
            getRowContent: s => (
              <div>
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
            headerProps: { rowSpan: 2, width: 3 },
          },
          {
            key: 'TOTAL',
            title: 'All students',
            getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.students.total),
            getCellProps: s => defineCellColor(s),
            headerProps: { rowSpan: 2, width: 3 },
          },
          {
            key: 'PASSED',
            title: 'Passed',
            parent: true,
            headerProps: { colSpan: 3, width: 5 },
          },
          {
            key: 'PASS_FIRST',
            title: 'first try',
            getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.categories.passedFirst || 0),
            getCellProps: s => defineCellColor(s),
            cellProps: { width: 2 },
            child: true,
          },
          {
            key: 'PASS_EVENTUALLY',
            title: 'passed eventually',
            getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.categories.passedEventually || 0),
            getCellProps: s => defineCellColor(s),
            cellProps: { width: 2 },
            child: true,
          },
          {
            key: 'PASS_RATE',
            title: 'percentage',
            getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.passRate),
            getRowContent: s => (s.rowObfuscated ? 'NA' : formatPercentage(s.students.passRate || 0)),
            getCellProps: s => defineCellColor(s),
            cellProps: { width: 1 },
            child: true,
          },
          {
            key: 'FAIL',
            title: 'Failed',
            parent: true,
            headerProps: { colSpan: 3, width: 5 },
          },
          {
            key: 'NEVER PASSED',
            title: 'never passed',
            getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.categories.neverPassed || 0),
            getCellProps: s => defineCellColor(s),
            cellProps: { width: 2 },
            child: true,
          },
          {
            key: 'FAIL_RATE',
            title: 'percentage',
            getRowVal: s => (s.rowObfuscated ? 'NA' : s.students.failRate),
            getRowContent: s => (s.rowObfuscated ? 'NA' : formatPercentage(s.students.failRate || 0)),
            getCellProps: s => defineCellColor(s),
            cellProps: { width: 1 },
            child: true,
          },
        ]}
        data={stats}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are NOT included in the total</span>
      )}
    </div>
  )
}

StudentTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired,
  alternatives: arrayOf(string).isRequired,
  separate: bool,
  userHasAccessToAllStats: bool.isRequired,
  headerVisible: bool.isRequired,
}

StudentTable.defaultProps = {
  separate: false,
}

export default connect(null)(StudentTable)
