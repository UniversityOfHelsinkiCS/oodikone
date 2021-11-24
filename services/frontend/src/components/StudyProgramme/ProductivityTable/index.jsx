import React, { useState, useEffect } from 'react'
import moment from 'moment'
import { Table, Header, Grid, Label, Segment, Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, number, arrayOf, bool, string, oneOfType } from 'prop-types'
import { getProductivity } from '../../../redux/productivity'
import InfoBox from '../../Info/InfoBox'
import infotooltips from '../../../common/InfoToolTips'
import './productivityTable.css'

const ProductivityTable = ({ productivity, thesis, loading, error, showCredits, newProgramme }) => {
  const [selectedYear, setYear] = useState(newProgramme ? 2017 : null)

  const years = productivity
    ? productivity.data
        .map(stats => ({ key: stats.year, text: stats.year, value: stats.year }))
        .sort((year1, year2) => Number(year2.value) - Number(year1.value))
    : []

  useEffect(() => {
    if (!selectedYear && years.length > 5) {
      setYear(years[5].value)
    } else if (!selectedYear && years.length > 1) {
      setYear(years[years.length - 1].value)
    }
  }, [years])

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
    'Hyväksiluettu (not included in Credits column)',
  ].filter(_ => _)

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setYear(value)
  }

  const creditCell = content =>
    showCredits ? (
      <Table.Cell>{content}</Table.Cell>
    ) : (
      <Table.Cell
        className="productivity-table__not-available"
        title="Credits productivity statistics not available for old programmes"
      >
        Not available
      </Table.Cell>
    )

  return (
    <>
      <div style={{ marginTop: '2em' }}>
        <InfoBox content={infotooltips.PopulationOverview.YearlyProductivity} />
      </div>
      <Header>
        <Grid columns={2}>
          <Grid.Row>
            <Grid.Column>
              Yearly productivity
              {productivity && (
                <Header.Subheader data-cy="productivityUpdateStatus">
                  {`Last updated ${
                    productivity.lastUpdated
                      ? moment(productivity.lastUpdated).format('HH:mm:ss MM-DD-YYYY')
                      : 'unknown'
                  }`}
                  {productivity.status === 'RECALCULATING' && (
                    <Label content="Recalculating! Refresh page in a few minutes" color="red" />
                  )}
                </Header.Subheader>
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Header>
      <div>Statistics from selected year onwards</div>
      {years.length > 4 ? <Dropdown options={years} onChange={handleChange} selection value={selectedYear} /> : null}
      <Segment basic loading={loading} style={{ overflowX: 'auto' }}>
        <Table structured celled compact striped selectable className="fixed-header">
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
                  .filter(stats => Number(stats.year) >= Number(selectedYear))
                  .sort((year1, year2) => year2.year - year1.year)
                  .map(year => (
                    <Table.Row key={year.year}>
                      <Table.Cell>{year.year}</Table.Cell>
                      {creditCell(year.credits.toFixed(2))}
                      {thesisTypes.includes('BACHELOR') && <Table.Cell>{year.bThesis}</Table.Cell>}
                      {thesisTypes.includes('MASTER') && <Table.Cell>{year.mThesis}</Table.Cell>}
                      <Table.Cell>{year.graduated}</Table.Cell>
                      {creditCell(year.creditsForMajors.toFixed(2))}
                      {creditCell((year.credits - year.creditsForMajors).toFixed(2))}
                      {creditCell(year.transferredCredits.toFixed(2))}
                    </Table.Row>
                  ))
              : null}
          </Table.Body>
        </Table>
      </Segment>
    </>
  )
}

ProductivityTable.propTypes = {
  productivity: shape({
    lastUpdated: string,
    status: string,
    data: arrayOf(
      shape({
        year: oneOfType([number, string]),
        credits: number,
        mThesis: number,
        bThesis: number,
        graduated: number,
        creditsForMajors: number,
        transferredCredits: number,
      })
    ),
  }),
  thesis: arrayOf(
    shape({
      programmeCode: string,
      courseCode: string,
      thesisType: string,
      createdAt: string,
      updatedAt: string,
    })
  ),
  loading: bool.isRequired,
  error: bool.isRequired,
  showCredits: bool.isRequired,
  newProgramme: bool.isRequired,
}

ProductivityTable.defaultProps = {
  productivity: null,
  thesis: undefined,
}

export default connect(null, {
  dispatchGetProductivity: getProductivity,
})(ProductivityTable)
