import React from 'react'
import moment from 'moment'
import { Header, Loader, Table, Button, Grid } from 'semantic-ui-react'
import { shape, number, arrayOf, bool, string, func } from 'prop-types'
import { connect } from 'react-redux'
import { flatten, uniq } from 'lodash'
import { callApi } from '../../../apiConnection'
import { getThroughput } from '../../../redux/throughput'

const ThroughputTable = ({ throughput, thesis, loading, error, studyprogramme,
  dispatchGetThroughput }) => {
  const morethan = x => (total, amount) => (amount >= x ? total + 1 : total)
  if (error) return <h1>Oh no so error {error}</h1>
  const data = throughput && throughput.data ? throughput.data.filter(year => year.credits.length > 0) : []
  const genders = data.length > 0 ? uniq(flatten(data.map(year => Object.keys(year.genders)))) : []
  const renderGenders = genders.length > 0
  let thesisTypes = []
  if (thesis) {
    thesisTypes = thesis.map(t => t.thesisType)
  }
  const refresh = () => {
    callApi('/v2/studyprogrammes/throughput/recalculate', 'get', null, { code: studyprogramme })
      .then(() => { dispatchGetThroughput(studyprogramme) })
  }
  return (
    <React.Fragment>
      <Header>
        <Grid columns={2}>
          <Grid.Row>
            <Grid.Column>
              Population progress
              {throughput && (
                <Header.Subheader>
                  {`Last updated ${
                    throughput.lastUpdated
                      ? moment(throughput.lastUpdated).format('HH:mm:ss MM-DD-YYYY')
                      : 'unknown'
                  } ${throughput.status || ''}`}
                </Header.Subheader>
              )}
            </Grid.Column>
            <Grid.Column>
              <Button floated="right" onClick={refresh}>
                Recalculate
              </Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Header>
      <Loader active={loading} inline="centered">
        Loading...
      </Loader>
      <Table celled structured>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell rowSpan="2">Year</Table.HeaderCell>
            {
              renderGenders ?
                <Table.HeaderCell colSpan={genders.length + 1}>Students</Table.HeaderCell> :
                <Table.HeaderCell rowSpan="2">Students</Table.HeaderCell>
            }
            <Table.HeaderCell rowSpan="2">Graduated</Table.HeaderCell>
            <Table.HeaderCell colSpan="5">Credits</Table.HeaderCell>
            {(thesisTypes.includes('BACHELOR') ||
              thesisTypes.includes('MASTER')) && (
              <Table.HeaderCell colSpan={thesisTypes.length}>
                Thesis
              </Table.HeaderCell>
            )}
          </Table.Row>

          <Table.Row>
            {renderGenders ? <Table.HeaderCell content="Total" /> : null}
            {genders.map(gender => <Table.HeaderCell key={gender} content={gender} />)}
            <Table.HeaderCell content=">= 30" />
            <Table.HeaderCell content=">= 60" />
            <Table.HeaderCell content=">= 90" />
            <Table.HeaderCell content=">= 120" />
            <Table.HeaderCell content=">= 150" />
            {thesisTypes.includes('MASTER') && (
              <Table.HeaderCell content="Master" />
            )}
            {thesisTypes.includes('BACHELOR') && (
              <Table.HeaderCell content="Bachelor" />
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data
            .sort((year1, year2) =>
                Number(year2.year.slice(0, 4)) -
                Number(year1.year.slice(0, 4)))
            .map(year => (
              <Table.Row key={year.year}>
                <Table.Cell>{year.year}</Table.Cell>
                <Table.Cell>{year.credits.length}</Table.Cell>
                {genders.map(gender => (
                  <Table.Cell key={year.year + year.genders[gender]}>
                    {`${year.genders[gender]} (${Math.floor((year.genders[gender] / year.credits.length) * 100)}%)` || 0}
                  </Table.Cell>
                ))}
                <Table.Cell>{year.graduated}</Table.Cell>
                <Table.Cell>
                  {year.credits.reduce(morethan(30), 0)}
                </Table.Cell>
                <Table.Cell>
                  {year.credits.reduce(morethan(60), 0)}
                </Table.Cell>
                <Table.Cell>
                  {year.credits.reduce(morethan(90), 0)}
                </Table.Cell>
                <Table.Cell>
                  {year.credits.reduce(morethan(120), 0)}
                </Table.Cell>
                <Table.Cell>
                  {year.credits.reduce(morethan(150), 0)}
                </Table.Cell>
                {thesisTypes.includes('MASTER') ? (
                  <Table.Cell>{year.thesisM}</Table.Cell>
                ) : null}
                {thesisTypes.includes('BACHELOR') ? (
                  <Table.Cell>{year.thesisB}</Table.Cell>
                ) : null}
              </Table.Row>
            ))}
        </Table.Body>
      </Table>
    </React.Fragment>
  )
}

ThroughputTable.propTypes = {
  throughput: shape({
    lastUpdated: string,
    status: string,
    data: arrayOf(shape({
      year: string,
      credits: arrayOf(number),
      thesisM: number,
      thesisB: number,
      graduated: number
    }))
  }),
  thesis: arrayOf(shape({
    programmeCode: string,
    courseCode: string,
    thesisType: string,
    createdAt: string,
    updatedAt: string
  })),
  studyprogramme: string.isRequired,
  dispatchGetThroughput: func.isRequired,
  loading: bool.isRequired,
  error: bool.isRequired
}

ThroughputTable.defaultProps = {
  throughput: null,
  thesis: undefined
}

export default connect(
  null,
  {
    dispatchGetThroughput: getThroughput
  }
)(ThroughputTable)
