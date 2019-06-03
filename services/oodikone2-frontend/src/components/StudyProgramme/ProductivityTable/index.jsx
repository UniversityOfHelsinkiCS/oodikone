import React from 'react'
import moment from 'moment'
import { Table, Header, Loader, Button, Grid } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, number, arrayOf, bool, string, func } from 'prop-types'
import { callApi } from '../../../apiConnection'
import { getProductivity } from '../../../redux/productivity'

const ProductivityTable = ({ productivity, thesis, loading, error, studyprogramme, dispatchGetProductivity }) => {
  if (error) return <h1>Oh no so error {error}</h1>
  let thesisTypes = []
  if (thesis) {
    thesisTypes = thesis.map(t => t.thesisType)
  }
  const headerList = ['Year', 'Credits', thesisTypes.includes('MASTER') && 'Masters Thesis', thesisTypes.includes('BACHELOR') && 'Bachelors Thesis', 'Graduated', 'Graduation median time'].filter(_ => _)

  const refresh = () => {
    callApi('/v2/studyprogrammes/productivity/recalculate', 'get', null, { code: studyprogramme })
      .then(() => { dispatchGetProductivity(studyprogramme) })
  }
  console.log(productivity)
  return (
    <React.Fragment>
      <Header>
        <Grid columns={2}>
          <Grid.Row>
            <Grid.Column>
              Yearly productivity
              {productivity && (
                <Header.Subheader>
                  {`Last updated ${
                    productivity.lastUpdated
                      ? moment(productivity.lastUpdated).format('HH:mm:ss MM-DD-YYYY')
                      : 'unknown'
                  } ${productivity.status || ''}`}
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
      <Table structured celled>
        <Table.Header>
          <Table.Row>
            {headerList.map(header => (
              <Table.HeaderCell key={header}>{header}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {productivity && productivity.data
            ? productivity.data
                .sort((year1, year2) => year2.year - year1.year)
                .map(year => (
                  <Table.Row key={year.year}>
                    <Table.Cell>{year.year}</Table.Cell>
                    <Table.Cell>{Math.floor(year.credits)}</Table.Cell>
                    {thesisTypes.includes('BACHELOR') && (
                      <Table.Cell>{year.bThesis}</Table.Cell>
                    )}
                    {thesisTypes.includes('MASTER') && (
                      <Table.Cell>{year.mThesis}</Table.Cell>
                    )}
                    <Table.Cell>{year.graduated}</Table.Cell>
                    <Table.Cell>{year.medianGraduationTime} months</Table.Cell>
                  </Table.Row>
                ))
            : null}
        </Table.Body>
      </Table>
    </React.Fragment>
  )
}

ProductivityTable.propTypes = {
  productivity: shape({
    lastUpdated: string,
    status: string,
    data: arrayOf(shape({
      year: number,
      credits: number,
      mThesis: number,
      bThesis: number,
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
  dispatchGetProductivity: func.isRequired,
  loading: bool.isRequired,
  error: bool.isRequired
}

ProductivityTable.defaultProps = {
  productivity: null,
  thesis: undefined
}

export default connect(
  null,
  {
    dispatchGetProductivity: getProductivity
  }
)(ProductivityTable)
