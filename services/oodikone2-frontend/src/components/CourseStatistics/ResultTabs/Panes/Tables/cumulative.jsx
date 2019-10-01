import React from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { Header, Icon, Item } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { uniq } from 'lodash'
import { shape, string, number, oneOfType, arrayOf, bool } from 'prop-types'
import SortableTable from '../../../../SortableTable'
import { getUserIsAdmin } from '../../../../../common'

const CumulativeTable = ({ stats, name, isAdmin }) => {
  const showPopulation = (yearcode, years) => {
    const coursecodes = stats.map(s => s.coursecode)
    const queryObject = { from: yearcode, to: yearcode, coursecodes: JSON.stringify(uniq(coursecodes)), years }
    const searchString = qs.stringify(queryObject)
    return `/coursepopulation?${searchString}`
  }

  return (
    <div>
      <Header as="h3" content={name} textAlign="center" />
      <SortableTable
        defaultdescending
        getRowKey={s => s.code}
        tableProps={{ celled: true }}
        columns={[
          {
            key: 'TIME',
            title: 'Time',
            getRowVal: s => s.code,
            getRowContent: s =>
              isAdmin ? (
                <div>
                  {s.name}
                  <Item as={Link} to={showPopulation(s.code, s.name, s)}>
                    <Icon name="level up alternate" />
                  </Item>
                </div>
              ) : (
                s.name
              ),
            cellProps: { width: 4 }
          },
          { key: 'PASSED', title: 'Passed', getRowVal: s => s.cumulative.categories.passed, cellProps: { width: 4 } },
          { key: 'FAILED', title: 'Failed', getRowVal: s => s.cumulative.categories.failed, cellProps: { width: 4 } },
          {
            key: 'PASSRATE',
            title: 'Pass rate',
            getRowVal: s =>
              s.cumulative.categories.passed / (s.cumulative.categories.failed + s.cumulative.categories.passed),
            getRowContent: stat =>
              `${Number(
                (100 * stat.cumulative.categories.passed) /
                  (stat.cumulative.categories.failed + stat.cumulative.categories.passed) || 0
              ).toFixed(2)} %`,
            cellProps: { width: 4 }
          }
        ]}
        data={stats}
      />
    </div>
  )
}

CumulativeTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired,
  isAdmin: bool.isRequired
}

export default connect(({ auth: { token: { roles } } }) => ({ isAdmin: getUserIsAdmin(roles) }))(CumulativeTable)
