import React, { useState, useEffect } from 'react'
import { Table, Header, Grid, Segment } from 'semantic-ui-react'
import { shape, any, arrayOf, bool, oneOfType, array } from 'prop-types'

const DIRECTIONS = {
  ASC: 'ascending', // true
  DESC: 'descending' // false
}

function sortBy(column, data) {
  const sortByString = column === 'name' || column === 'code'
  return data.concat().sort((a, b) => {
    const keyA = column === 'name' ? a[column].fi : a[column]
    const keyB = column === 'name' ? b[column].fi : b[column]
    return sortByString ? keyB.localeCompare(keyA) : keyB - keyA
  })
}

const BachelorsTable = ({ bachelors, loading }) => {
  const [bachelorsData, setBachelorsData] = useState({})
  const [sortColumn, setSortColumn] = useState(null)
  const [direction, setDirection] = useState(false)

  useEffect(() => setBachelorsData(bachelors), [bachelors])

  useEffect(() => {
    if (!bachelorsData || !bachelorsData.data) return
    const data = sortBy(sortColumn, bachelorsData.data)
    if (direction) data.reverse()
    setBachelorsData({ ...bachelorsData, data })
  }, [direction, sortColumn])

  const getSorted = column => {
    if (column !== sortColumn) return null
    return direction ? DIRECTIONS.ASC : DIRECTIONS.DESC
  }

  const setSorted = column => {
    if (column === sortColumn) setDirection(!direction)
    else {
      setSortColumn(column)
      setDirection(false)
    }
  }

  if (!loading && (!bachelorsData.data || !bachelorsData.data.length)) return null
  return (
    <>
      <Header>
        <Grid columns={2}>
          <Grid.Row>
            <Grid.Column>Study programme options</Grid.Column>
          </Grid.Row>
        </Grid>
      </Header>
      {bachelorsData && bachelorsData.years && `Statistics from ${bachelorsData.years.length} years`}
      <Segment basic loading={loading} style={{ overflowX: 'auto' }}>
        <Table celled structured compact striped selectable sortable>
          {bachelorsData && bachelorsData.data ? (
            <>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell sorted={getSorted('name')} onClick={() => setSorted('name')}>
                    Name
                  </Table.HeaderCell>
                  <Table.HeaderCell sorted={getSorted('code')} onClick={() => setSorted('code')}>
                    Code
                  </Table.HeaderCell>
                  {bachelorsData.years.map(year => (
                    <Table.HeaderCell sorted={getSorted(year)} onClick={() => setSorted(year)} key={year}>
                      {year}
                    </Table.HeaderCell>
                  ))}
                  <Table.HeaderCell sorted={getSorted('total')} onClick={() => setSorted('total')}>
                    Total
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {bachelorsData.data.map(item => (
                  <Table.Row key={item.code}>
                    <Table.Cell>{item.name.fi}</Table.Cell>
                    <Table.Cell>{item.code}</Table.Cell>
                    {bachelorsData.years.map(year => (
                      <Table.Cell key={year}>{item[year]}</Table.Cell>
                    ))}
                    <Table.Cell>{item.total}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </>
          ) : null}
        </Table>
      </Segment>
    </>
  )
}

BachelorsTable.propTypes = {
  bachelors: oneOfType([
    shape({
      data: arrayOf(any),
      years: arrayOf(any)
    }),
    array
  ]),
  loading: bool.isRequired
}

BachelorsTable.defaultProps = {
  bachelors: null
}

export default BachelorsTable
