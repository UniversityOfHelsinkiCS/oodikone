import React from 'react'
import { Table, Header, Loader } from 'semantic-ui-react'
import { shape, number, arrayOf, bool } from 'prop-types'

const ProductivityTable = ({ productivity, loading, error }) => {
  if (error) return <h1>Oh no so error {error}</h1>
  return (
    productivity.length === 0 && !loading ? null :
    <React.Fragment>
      <Header>Yearly productivity</Header>
      <Table celled>
        <Table.Header>
          <Table.Row>
            {['Year', 'Credits', 'Thesis', 'Graduated'].map(header =>
              <Table.HeaderCell key={header}>{header}</Table.HeaderCell>)}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {productivity.map(year => (
            <Table.Row key={year.year}>
              <Table.Cell>{year.year}</Table.Cell>
              <Table.Cell>{year.credits}</Table.Cell>
              <Table.Cell>{year.thesis}</Table.Cell>
              <Table.Cell>{year.graduated}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>

      </Table>
    </React.Fragment>
  )
}

ProductivityTable.propTypes = {
  productivity: arrayOf(shape({
    year: number,
    credits: number,
    thesis: number,
    graduated: number
  })).isRequired,
  loading: bool.isRequired,
  error: bool.isRequired
}

export default ProductivityTable
