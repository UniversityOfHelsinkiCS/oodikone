import React from 'react'
import { Table, Header, Grid, Segment } from 'semantic-ui-react'
import { shape, any, arrayOf, bool } from 'prop-types'


const BachelorsTable = ({ bachelors, loading }) => {
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
        <Table selectable>
          {bachelors && bachelors.data
            ? bachelors.data.map(item => (
                <>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>{item.year}</Table.HeaderCell>
                      <Table.HeaderCell>Lukumäärä</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {item.bachelors.map(bachelor => (
                      <Table.Row>
                        <Table.Cell>{bachelor.name}</Table.Cell>
                        <Table.Cell>{bachelor.amount}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </>
              ))
            : null}
        </Table>
      </Segment>
    </>
  )
}

BachelorsTable.propTypes = {
  bachelors: shape({
    data: arrayOf(any)
  }),
  loading: bool.isRequired
}

BachelorsTable.defaultProps = {
  bachelors: null
}

export default BachelorsTable
