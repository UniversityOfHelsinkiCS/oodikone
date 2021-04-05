import React from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { Header, Icon, Item } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { uniq } from 'lodash'
import { shape, string, number, oneOfType, arrayOf, bool } from 'prop-types'
import SortableTable from '../../../../SortableTable'
import { defineCellColor } from '../util'

const AttemptsTable = ({ stats, name, alternatives, separate, headerVisible = false, userHasAccessToAllStats }) => {
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
      {headerVisible && (
        <Header as="h3" textAlign="center">
          {name}
        </Header>
      )}
      <SortableTable
        defaultdescending
        getRowKey={s => s.code}
        tableProps={{ celled: true }}
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
            cellProps: { width: 4 }
          },
          {
            key: 'PASSED',
            title: 'Passed',
            // Backend returns duplicates in `s.attempts` -> use `s.students`.
            getRowVal: s =>
              s.rowObfuscated ? '5 or less students' : Object.values(s.students.grades).reduce((a, b) => a + b, 0),
            getCellProps: s => defineCellColor(s),
            cellProps: { width: 4 }
          },
          {
            key: 'FAILED',
            title: 'Failed',
            getRowVal: s => (s.rowObfuscated ? '5 or less students' : s.attempts.categories.failed),
            getCellProps: s => defineCellColor(s),
            cellProps: { width: 4 }
          },
          {
            key: 'PASSRATE',
            title: 'Pass rate',
            getRowVal: s => (s.rowObfuscated ? 'NA' : s.attempts.passRate),
            getRowContent: s => (s.rowObfuscated ? 'NA' : `${Number(s.attempts.passRate || 0).toFixed(2)} %`),
            getCellProps: s => defineCellColor(s),
            cellProps: { width: 4 }
          }
        ]}
        data={stats}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are NOT included in the total</span>
      )}
    </div>
  )
}

AttemptsTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired,
  alternatives: arrayOf(string).isRequired,
  separate: bool,
  userHasAccessToAllStats: bool.isRequired,
  headerVisible: bool.isRequired
}

AttemptsTable.defaultProps = {
  separate: false
}

export default connect(null)(AttemptsTable)
