import React from 'react'
import { Table, Header, Grid, Segment } from 'semantic-ui-react'
import { shape, any, arrayOf, bool } from 'prop-types'

const BachelorsTable = ({ bachelors, loading }) => (
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
      <Table selectable sortable>
        {bachelors && bachelors.data ? (
          <>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Code</Table.HeaderCell>
                {bachelors.years.map(year => (
                  <Table.HeaderCell key={year}>{year}</Table.HeaderCell>
                ))}
                <Table.HeaderCell>Total</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Object.keys(bachelors.data).map(code => (
                <Table.Row key={code}>
                  <Table.Cell>{bachelors.data[code].name.fi}</Table.Cell>
                  <Table.Cell>{code}</Table.Cell>
                  {bachelors.years.map(year => (
                    <Table.Cell key={year}>{bachelors.data[code][year]}</Table.Cell>
                  ))}
                  <Table.Cell>{bachelors.data[code].total}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </>
        ) : null}
      </Table>
    </Segment>
  </>
)

BachelorsTable.propTypes = {
  bachelors: shape({
    data: shape({}),
    years: arrayOf(any)
  }),
  loading: bool.isRequired
}

BachelorsTable.defaultProps = {
  bachelors: null
}

export default BachelorsTable
