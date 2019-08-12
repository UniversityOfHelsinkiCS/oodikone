import React from 'react'
import qs from 'query-string'
import { Header, Icon } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf } from 'prop-types'
import SortableTable from '../../../../SortableTable'
import { userIsAdmin } from '../../../../../common'

const CumulativeTable = ({ stats, name, history }) => {
  const admin = userIsAdmin()
  const showPopulation = (yearcode, coursecode, year) => {
    const queryObject = { yearcode, coursecode, year }
    const searchString = qs.stringify(queryObject)
    history.push(`/coursepopulation?${searchString}`)
  }

  return (
    <div>
      <Header as="h3" content={name} textAlign="center" />
      <SortableTable
        getRowKey={s => s.code}
        tableProps={{ celled: true }}
        columns={[
          {
            key: 'TIME',
            title: 'Time',
            getRowVal: s => s.code,
            getRowContent: s => (admin ? (<div>{s.name}<Icon name="level up alternate" onClick={() => showPopulation(s.code, s.coursecode, s.name)} /></div>) : s.name),
            cellProps: { width: 4 }
          },
          { key: 'PASSED', title: 'Passed', getRowVal: s => s.cumulative.categories.passed, cellProps: { width: 4 } },
          { key: 'FAILED', title: 'Failed', getRowVal: s => s.cumulative.categories.failed, cellProps: { width: 4 } },
          {
            key: 'PASSRATE',
            title: 'Pass rate',
            getRowVal: s => s.cumulative.categories.passed /
              (s.cumulative.categories.failed + s.cumulative.categories.passed),
            getRowContent: stat => `${Number((100 * stat.cumulative.categories.passed) /
              (stat.cumulative.categories.failed + stat.cumulative.categories.passed) || 0).toFixed(2)} %`,
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
  history: shape({}).isRequired
}

export default CumulativeTable
