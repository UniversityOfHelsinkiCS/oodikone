import React from 'react'
import { Header, Loader, Table } from 'semantic-ui-react'
import { shape, number, arrayOf, bool, string } from 'prop-types'

const ThroughputTable = ({ throughput, thesis, loading, error }) => {
  const morethan = x => (total, amount) => amount >= x ? total + 1 : total // eslint-disable-line
  if (error) return <h1>Oh no so error {error}</h1>
  const data = throughput ? throughput.filter(year => year.credits.length > 0) : []
  let thesisTypes = []
  if (thesis) {
    thesisTypes = thesis.map(t => t.thesisType)
  }
  return (
    <React.Fragment>
      <Header>Population progress</Header>
      <Loader active={loading} inline="centered">Loading...</Loader>
      <Table celled structured>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell rowSpan="2">Year</Table.HeaderCell>
            <Table.HeaderCell rowSpan="2">Students</Table.HeaderCell>
            <Table.HeaderCell rowSpan="2">Graduated</Table.HeaderCell>
            <Table.HeaderCell colSpan="5">Credits</Table.HeaderCell>
            <Table.HeaderCell colSpan={thesisTypes.length}>Thesis</Table.HeaderCell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell content=">= 30" />
            <Table.HeaderCell content=">= 60" />
            <Table.HeaderCell content=">= 90" />
            <Table.HeaderCell content=">= 120" />
            <Table.HeaderCell content=">= 150" />
            {thesisTypes.includes('MASTER') && <Table.HeaderCell content="Master" />}
            {thesisTypes.includes('BACHELOR') && <Table.HeaderCell content="Bachelor" />}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data
            .sort((year1, year2) => Number(year2.year.slice(0, 4)) - Number(year1.year.slice(0, 4)))
            .map(year =>
              (
                <Table.Row key={year.year}>
                  <Table.Cell>{year.year}</Table.Cell>
                  <Table.Cell>{year.credits.length}</Table.Cell>
                  <Table.Cell>{year.graduated}</Table.Cell>
                  <Table.Cell>{year.credits.reduce(morethan(30), 0)}</Table.Cell>
                  <Table.Cell>{year.credits.reduce(morethan(60), 0)}</Table.Cell>
                  <Table.Cell>{year.credits.reduce(morethan(90), 0)}</Table.Cell>
                  <Table.Cell>{year.credits.reduce(morethan(120), 0)}</Table.Cell>
                  <Table.Cell>{year.credits.reduce(morethan(150), 0)}</Table.Cell>
                  {thesisTypes.includes('MASTER') ? <Table.Cell>{year.thesisM}</Table.Cell> : null}
                  {thesisTypes.includes('BACHELOR') ? <Table.Cell>{year.thesisB}</Table.Cell> : null}
                </Table.Row>
              ))}
        </Table.Body>
      </Table>
    </React.Fragment>
  )
}

ThroughputTable.propTypes = {
  throughput: arrayOf(shape({
    year: string,
    credits: arrayOf(number),
    thesisM: number,
    thesisB: number,
    graduated: number
  })), // eslint-disable-line
  thesis: arrayOf(shape({
    programmeCode: string,
    courseCode: string,
    thesisType: string,
    createdAt: string,
    updatedAt: string
  })),
  loading: bool.isRequired,
  error: bool.isRequired
}

ThroughputTable.defaultProps = {
  throughput: null,
  thesis: undefined
}

export default ThroughputTable
