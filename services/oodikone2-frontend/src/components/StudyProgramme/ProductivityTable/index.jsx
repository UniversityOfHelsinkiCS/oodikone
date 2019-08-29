import React from 'react'
import moment from 'moment'
import { Table, Header, Button, Grid, Label, Segment } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, number, arrayOf, bool, string, func, oneOfType } from 'prop-types'
import { callApi } from '../../../apiConnection'
import { getProductivity } from '../../../redux/productivity'

const ProductivityTable = ({ productivity, thesis, loading, error, studyprogramme, dispatchGetProductivity }) => {
  if (error) return <h1>Oh no so error {error}</h1>
  let thesisTypes = []
  if (thesis) {
    thesisTypes = thesis.map(t => t.thesisType)
  }
  const headerList = [
    'Year',
    'Credits',
    thesisTypes.includes('MASTER') && 'Masters Thesis',
    thesisTypes.includes('BACHELOR') && 'Bachelors Thesis',
    'Graduated',
    'Credits for studyprogramme majors',
    'Credits for non major students',
    'Hyväksiluettu (not included in Credits column)'
  ].filter(_ => _)
  const refresh = () => {
    callApi('/v2/studyprogrammes/productivity/recalculate', 'get', null, { code: studyprogramme })
      .then(() => { dispatchGetProductivity(studyprogramme) })
  }
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
                    }`}
                    {productivity.status === 'RECALCULATING' && <Label content="Recalculating! Refresh page in a few minutes" color="red" />}
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
      <Segment basic loading={loading}>
        <Table structured celled className="fixed-header">
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
                    <Table.Cell>{year.credits.toFixed(2)}</Table.Cell>
                    {thesisTypes.includes('BACHELOR') && (
                      <Table.Cell>{year.bThesis}</Table.Cell>
                    )}
                    {thesisTypes.includes('MASTER') && (
                      <Table.Cell>{year.mThesis}</Table.Cell>
                    )}
                    <Table.Cell>{year.graduated}</Table.Cell>
                    <Table.Cell>{year.creditsForMajors.toFixed(2)}</Table.Cell>
                    <Table.Cell>{(year.credits - year.creditsForMajors).toFixed(2)}</Table.Cell>
                    <Table.Cell>{year.transferredCredits.toFixed(2)}</Table.Cell>
                  </Table.Row>
                ))
              : null}
          </Table.Body>
        </Table>
      </Segment>
    </React.Fragment>
  )
}

ProductivityTable.propTypes = {
  productivity: shape({
    lastUpdated: string,
    status: string,
    data: arrayOf(shape({
      year: oneOfType([number, string]),
      credits: number,
      mThesis: number,
      bThesis: number,
      graduated: number,
      creditsForMajors: number,
      transferredCredits: number
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
