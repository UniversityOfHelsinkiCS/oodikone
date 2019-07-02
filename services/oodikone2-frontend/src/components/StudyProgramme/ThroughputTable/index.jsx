import React, { Fragment, useEffect, useState } from 'react'
import moment from 'moment'
import { Header, Loader, Table, Button, Grid, Icon } from 'semantic-ui-react'
import { shape, number, arrayOf, bool, string, func } from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { flatten, uniq } from 'lodash'
import { callApi } from '../../../apiConnection'
import { getThroughput } from '../../../redux/throughput'
import { userRoles } from '../../../common'

const ThroughputTable = ({ history, throughput, thesis, loading, error, studyprogramme,
  dispatchGetThroughput }) => {
  const [roles, setRoles] = useState(undefined)
  const setFuckingRoles = async () => {
    setRoles(await userRoles())
  }
  useEffect(() => {
    setFuckingRoles()
  }, [])
  const showPopulationStatistics = (yearLabel) => {
    const year = Number(yearLabel.slice(0, 4))
    const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
    history.push(`/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&startYear=${year}&endYear=${year}`)
  }
  if (error) return <h1>Oh no so error {error}</h1>
  let GRADUATED_FEATURE_TOGGLED_ON = false
  if (roles) {
    GRADUATED_FEATURE_TOGGLED_ON = roles.includes('dev')
  }
  const data = throughput && throughput.data ? throughput.data.filter(year => year.credits.length > 0) : []
  const genders = data.length > 0 ? uniq(flatten(data.map(year => Object.keys(year.genders)))) : []
  const countries = data.length > 0 && throughput.totals.countries ?
    uniq(flatten(data.map(year => Object.keys(year.countries)))).sort() : []
  const renderGenders = genders.length > 0
  const renderCountries = countries.length > 0
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
            <Table.HeaderCell colSpan={GRADUATED_FEATURE_TOGGLED_ON ? '3' : '1'}>Graduated</Table.HeaderCell>

            <Table.HeaderCell rowSpan="2">Transferred to this program</Table.HeaderCell>
            {
              renderCountries ?
                <Table.HeaderCell colSpan={countries.length}>Countries</Table.HeaderCell> : null
            }
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
            <Table.HeaderCell >Graduated overall</Table.HeaderCell>
            {GRADUATED_FEATURE_TOGGLED_ON &&
              <Fragment>
                <Table.HeaderCell >Graduated in time</Table.HeaderCell>
                <Table.HeaderCell >Graduation median time</Table.HeaderCell>
              </Fragment>
            }
            {renderCountries ? countries.map(country => <Table.HeaderCell key={country} content={country} />) : null}
            <Table.HeaderCell content="≥ 30" />
            <Table.HeaderCell content="≥ 60" />
            <Table.HeaderCell content="≥ 90" />
            <Table.HeaderCell content="≥ 120" />
            <Table.HeaderCell content="≥ 150" />
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
                <Table.Cell>
                  {year.year}
                  <Icon name="level up alternate" onClick={() => showPopulationStatistics(year.year)} />
                </Table.Cell>
                <Table.Cell>{year.credits.length}</Table.Cell>
                {genders.map(gender => (
                  <Table.Cell key={`${year.year} gender:${gender}`}>
                    {`${year.genders[gender] || 0} (${Math.floor((year.genders[gender] / year.credits.length) * 100) || 0}%)`}
                  </Table.Cell>
                ))}
                <Table.Cell>{year.graduated}</Table.Cell>
                {GRADUATED_FEATURE_TOGGLED_ON &&
                  <Fragment>
                    <Table.Cell>{year.inTargetTime}</Table.Cell>
                    <Table.Cell>{year.medianGraduationTime ? `${year.medianGraduationTime} months` : '∞'}</Table.Cell>
                  </Fragment>
                }
                <Table.Cell>{year.transferred}</Table.Cell>
                {renderCountries ? countries.map(country => (
                  <Table.Cell key={`${year.year} country:${country}`}>
                    {year.countries[country] || 0}
                  </Table.Cell>
                )) : null}
                {Object.keys(year.creditValues).map(creditKey => (
                  <Table.Cell key={`${year.year} credit:${creditKey}`}>{year.creditValues[creditKey]}
                  </Table.Cell>
                ))}
                {thesisTypes.includes('MASTER') ? (
                  <Table.Cell>{year.thesisM}</Table.Cell>
                ) : null}
                {thesisTypes.includes('BACHELOR') ? (
                  <Table.Cell>{year.thesisB}</Table.Cell>
                ) : null}
              </Table.Row>
            ))}
        </Table.Body>
        {throughput && throughput.totals ?
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell style={{ fontWeight: 'bold' }}>Total</Table.HeaderCell>
              <Table.HeaderCell>{throughput.totals.students}</Table.HeaderCell>
              {Object.keys(throughput.totals.genders).map(genderKey => (
                <Table.HeaderCell key={`${genderKey}total`}>
                  {`${throughput.totals.genders[genderKey]} (${Math.floor((throughput.totals.genders[genderKey] / throughput.totals.students) * 100)}%)`}
                </Table.HeaderCell>
              ))}
              <Table.HeaderCell>{throughput.totals.graduated}</Table.HeaderCell>
              {GRADUATED_FEATURE_TOGGLED_ON &&
                <Fragment>
                  <Table.HeaderCell>{throughput.totals.inTargetTime}</Table.HeaderCell>
                  <Table.HeaderCell>{throughput.totals.medianGraduationTime ? `${throughput.totals.medianGraduationTime} months` : '∞'}</Table.HeaderCell>
                </Fragment>
              }
              <Table.HeaderCell>{throughput.totals.transferred}</Table.HeaderCell>
              {renderCountries ? Object.keys(throughput.totals.countries).map(countryKey => (
                <Table.HeaderCell key={`${countryKey}total`}>
                  {throughput.totals.countries[countryKey]}
                </Table.HeaderCell>
              )) : null}
              {Object.keys(throughput.totals.credits).map(creditKey => (
                <Table.HeaderCell key={`${creditKey}total`}>{throughput.totals.credits[creditKey]}
                </Table.HeaderCell>
              ))}
              {thesisTypes.includes('MASTER') ? (
                <Table.HeaderCell>{throughput.totals.thesisM}</Table.HeaderCell>
              ) : null}
              {thesisTypes.includes('BACHELOR') ? (
                <Table.HeaderCell>{throughput.totals.thesisB}</Table.HeaderCell>
              ) : null}
            </Table.Row>
          </Table.Footer> : null}
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
  error: bool.isRequired,
  history: shape({
    push: func.isRequired
  }).isRequired
}

ThroughputTable.defaultProps = {
  throughput: null,
  thesis: undefined
}

export default withRouter(connect(
  null,
  {
    dispatchGetThroughput: getThroughput
  }
)(ThroughputTable))
