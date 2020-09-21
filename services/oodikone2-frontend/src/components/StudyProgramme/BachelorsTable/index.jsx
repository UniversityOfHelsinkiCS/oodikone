import React, { useState, useEffect } from 'react'
import { Table, Header, Grid, Segment } from 'semantic-ui-react'
import { shape, any, arrayOf, bool } from 'prop-types'

const DIRECTIONS = {
  ASC: 'ascending', // true
  DESC: 'descending' // false
}

const BachelorsTable = ({ bachelors, loading }) => {
  const [bachelorsData, setBachelorsData] = useState([])
  const [sortColumn, setSortColumn] = useState('name')
  const [direction, setDirection] = useState(false)

  useEffect(() => setBachelorsData(bachelors), [bachelors])

  useEffect(() => {
    if (!bachelorsData || !bachelorsData.data) return
    const data = bachelorsData.data
      .concat()
      .sort((a, b) => (sortColumn === 'name' ? b[sortColumn].fi - a[sortColumn].fi : b[sortColumn] - a[sortColumn]))
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

  return (
    <>
      <Header>
        <Grid columns={2}>
          <Grid.Row>
            <Grid.Column>
              Cool options table here
              <Header.Subheader>Last updated: tomorrow</Header.Subheader>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Header>
      <div>Statistics from n+1 years</div>
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
                  <Table.HeaderCell>Total</Table.HeaderCell>
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
  bachelors: shape({
    data: arrayOf(any),
    years: arrayOf(any)
  }),
  loading: bool.isRequired
}

BachelorsTable.defaultProps = {
  bachelors: null
}

export default BachelorsTable
