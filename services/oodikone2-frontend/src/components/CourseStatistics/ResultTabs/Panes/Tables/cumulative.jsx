import React from 'react'
import qs from 'query-string'
import { Link } from 'react-router-dom'
import { Header, Icon, Item } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { uniq } from 'lodash'
import { shape, string, number, oneOfType, arrayOf, bool } from 'prop-types'
import SortableTable from '../../../../SortableTable'

const CumulativeTable = ({ stats, name, alternatives, separate }) => {
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
              s.code !== 9999 ? (
                <div>
                  {s.name}
                  {s.name !== 'Total' ? (
                    <Item as={Link} to={showPopulation(s.code, s.name, s)}>
                      <Icon name="level up alternate" />
                    </Item>
                  ) : null}
                </div>
              ) : (
                <div>{s.name}</div>
              ),
            cellProps: { width: 4 }
          },
          {
            key: 'PASSED',
            title: 'Passed',
            // Backend returns duplicates in `s.cumulative` -> use `s.students`.
            getRowVal: s => Object.values(s.students.grades).reduce((a, b) => a + b, 0),
            cellProps: { width: 4 }
          },
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
  alternatives: arrayOf(string).isRequired,
  separate: bool
}

CumulativeTable.defaultProps = {
  separate: false
}

export default connect(null)(CumulativeTable)
