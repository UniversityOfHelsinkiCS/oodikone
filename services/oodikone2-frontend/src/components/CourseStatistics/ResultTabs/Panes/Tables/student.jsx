import React from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { Header, Icon, Item } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { uniq } from 'lodash'
import { shape, string, number, oneOfType, arrayOf, bool } from 'prop-types'
import SortableTable from '../../../../SortableTable'

const formatPercentage = p => `${(p * 100).toFixed(2)} %`

const StudentTable = ({ stats, name, alternatives, separate }) => {
  const showPopulation = (yearcode, years) => {
    const queryObject = {
      from: yearcode,
      to: yearcode,
      coursecodes: JSON.stringify(uniq(alternatives)),
      years,
      separate
    }
    const searchString = qs.stringify(queryObject)
    return `/coursepopulation?${searchString}`
  }

  return (
    <div>
      <Header as="h3" textAlign="center">
        {name}
      </Header>
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
                {s.name !== 'Total' ? (
                  <Item as={Link} to={showPopulation(s.code, s.name, s)}>
                    <Icon name="level up alternate" />
                  </Item>
                ) : null}
              </div>
            ),
            getCellProps: s => s.obfuscated && { style: { color: 'gray' } },
            headerProps: { rowSpan: 2, width: 3 }
          },
          {
            key: 'TOTAL',
            title: 'Students',
            getRowVal: s => s.obfuscated ? '5 or less students' : s.students.total,
            getCellProps: s => s.obfuscated && { style: { color: 'gray' } },
            headerProps: { rowSpan: 2, width: 3 }
          },
          {
            key: 'PASSED',
            title: 'Passed',
            parent: true,
            headerProps: { colSpan: 3, width: 5 }
          },
          {
            key: 'PASS_FIRST',
            title: 'first try',
            getRowVal: s => s.obfuscated ? 'NA' : s.students.categories.passedFirst || 0,
            getCellProps: s => s.obfuscated && { style: { color: 'gray' } },
            cellProps: { width: 2 },
            child: true
          },
          {
            key: 'PASS_RETRY',
            title: 'after retry',
            getRowVal: s => s.obfuscated ? 'NA' : s.students.categories.passedRetry || 0,
            getCellProps: s => s.obfuscated && { style: { color: 'gray' } },
            cellProps: { width: 2 },
            child: true
          },
          {
            key: 'PASS_RATE',
            title: 'percentage',
            getRowVal: s => s.obfuscated ? 'NA' : s.students.passRate,
            getRowContent: s => s.obfuscated ? 'NA' : formatPercentage(s.students.passRate),
            getCellProps: s => s.obfuscated && { style: { color: 'gray' } },
            cellProps: { width: 1 },
            child: true
          },
          {
            key: 'FAIL',
            title: 'Failed',
            parent: true,
            headerProps: { colSpan: 3, width: 5 }
          },
          {
            key: 'FAIL_FIRST',
            title: 'first try',
            getRowVal: s => s.obfuscated ? 'NA' : s.students.categories.failedFirst || 0,
            getCellProps: s => s.obfuscated && { style: { color: 'gray' } },
            cellProps: { width: 2 },
            child: true
          },
          {
            key: 'FAIL_RETRY',
            title: 'after retry',
            getRowVal: s => s.obfuscated ? 'NA' : s.students.categories.failedRetry || 0,
            getCellProps: s => s.obfuscated && { style: { color: 'gray' } },
            cellProps: { width: 2 },
            child: true
          },
          {
            key: 'FAIL_RATE',
            title: 'percentage',
            getRowVal: s => s.obfuscated ? 'NA': s.students.failRate,
            getRowContent: s => s.obfuscated ? 'NA' : formatPercentage(s.students.failRate),
            getCellProps: s => s.obfuscated && { style: { color: 'gray' } },
            cellProps: { width: 1 },
            child: true
          }
        ]}
        data={stats}
      />
    </div>
  )
}

StudentTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired,
  alternatives: arrayOf(string).isRequired,
  separate: bool
}

StudentTable.defaultProps = {
  separate: false
}

export default connect(null)(StudentTable)
