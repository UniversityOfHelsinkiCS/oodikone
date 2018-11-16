import React from 'react'
import { Header } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf } from 'prop-types'
import SortableTable from '../SortableTable'

const StudentTable = ({ stats, name }) => {
  const formatted = stats.map((statistic) => {
    const { name: n, code, students } = statistic
    const {
      passedFirst = 0,
      passedRetry = 0,
      failedFirst = 0,
      failedRetry = 0
    } = students.categories
    return ({ name: n, code, passedFirst, passedRetry, failedFirst, failedRetry })
  })
  return (
    <div>
      <Header as="h3" content={name} textAlign="center" />
      <SortableTable
        getRowKey={s => s.code}
        tableProps={{ celled: true }}
        columns={[
          { key: 'TIME', title: 'Time', getRowVal: s => s.code, getRowContent: s => s.name, cellProps: { width: 4, singleLine: true } },
          { key: 'PASS_FIRST', title: 'Passed on first try', getRowVal: s => s.passedFirst, cellProps: { width: 3 } },
          { key: 'PASS_RETRY', title: 'Passed after retry', getRowVal: s => s.passedRetry, cellProps: { width: 3 } },
          { key: 'FAIL_FIRST', title: 'Failed on first try', getRowVal: s => s.failedFirst, cellProps: { width: 3 } },
          { key: 'FAIL_RETRY', title: 'Failed on retry', getRowVal: s => s.failedRetry, cellProps: { width: 3 } }
        ]}
        data={formatted}
      />
    </div>
  )
}

StudentTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired
}

export default StudentTable
