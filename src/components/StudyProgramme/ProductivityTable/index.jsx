import React from 'react'
import { Table, Header, Loader } from 'semantic-ui-react'
import { shape, number, arrayOf, bool } from 'prop-types'

const ProductivityTable = ({ productivity, loading, error }) => {
  if (error) return <h1>Oh no so error {error}</h1>
  return (
    <React.Fragment>
      <Header>Yearly productivity</Header>
      <Loader active={loading} inline="centered">Loading...</Loader>
      <Table structured celled>
        <Table.Header>
          <Table.Row>
            {['Year', 'Credits', 'Bachelors Thesis', 'Masters Thesis', 'Graduated'].map(header =>
              <Table.HeaderCell key={header}>{header}</Table.HeaderCell>)}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {productivity ? productivity.map(year => (
            <Table.Row key={year.year}>
              <Table.Cell>{year.year}</Table.Cell>
              <Table.Cell>{year.credits}</Table.Cell>
              <Table.Cell>{year.bThesis}</Table.Cell>
              <Table.Cell>{year.mThesis}</Table.Cell>
              <Table.Cell>{year.graduated}</Table.Cell>
            </Table.Row>
          )) : null}
        </Table.Body>
      </Table>
    </React.Fragment>
  )
}

ProductivityTable.propTypes = {
  productivity: arrayOf(shape({
    year: number,
    credits: number,
    mThesis: number,
    bThesis: number,
    graduated: number
  })), // eslint-disable-line
  loading: bool.isRequired,
  error: bool.isRequired
}

ProductivityTable.defaultProps = {
  productivity: null
}

export default ProductivityTable
