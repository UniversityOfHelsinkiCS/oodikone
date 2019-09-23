import React, { Fragment } from 'react'
import moment from 'moment'
import { Header, Table, Grid, Icon, Label, Segment } from 'semantic-ui-react'
import { shape, number, arrayOf, bool, string, node } from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { flatten, uniq } from 'lodash'
import { getUserRoles } from '../../../common'
import InfoBox from '../../InfoBox'
import infotooltips from '../../../common/InfoToolTips'

const PopulationStatisticsLink = ({ studyprogramme, year: yearLabel, children }) => {
  const year = Number(yearLabel.slice(0, 4))
  const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
  const href =
    `/populations?months=${months}&semesters=FALL&semesters=` +
    `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&startYear=${year}&endYear=${year}`
  return (
    <Link title={`Population statistics of class ${yearLabel}`} to={href}>
      {children}
    </Link>
  )
}

PopulationStatisticsLink.propTypes = {
  studyprogramme: string.isRequired,
  year: string.isRequired,
  children: node.isRequired
}

const ThroughputTable = ({ throughput, thesis, loading, error, studyprogramme, userRoles }) => {
  if (error) return <h1>Oh no so error {error}</h1>
  const GRADUATED_FEATURE_TOGGLED_ON = userRoles.includes('dev')
  const data = throughput && throughput.data ? throughput.data.filter(year => year.credits.length > 0) : []
  const genders = data.length > 0 ? uniq(flatten(data.map(year => Object.keys(year.genders)))) : []
  const renderGenders = genders.length > 0

  const calculateTotalNationalities = () =>
    data.length > 0 ? Object.values(throughput.totals.nationalities).reduce((res, curr) => res + curr, 0) : 0

  const renderRatioOfFinns = calculateTotalNationalities() > 0
  let thesisTypes = []
  if (thesis) {
    thesisTypes = thesis.map(t => t.thesisType)
  }

  const renderStudentsHeader = () => {
    let colSpan = 1
    let rowSpan = 1

    if (renderGenders) colSpan += genders.length
    if (renderRatioOfFinns) colSpan += 1
    if (!renderGenders && !renderRatioOfFinns) rowSpan += 1

    return (
      <Table.HeaderCell colSpan={colSpan} rowSpan={rowSpan}>
        Students
      </Table.HeaderCell>
    )
  }

  const ratioOfFinnsIn = year => {
    const total = Object.values(year.nationalities).reduce((res, curr) => res + curr, 0)
    return (
      <Table.Cell>
        {`${year.nationalities.Finland || 0} (${Math.floor((year.nationalities.Finland / total) * 100) || 0}%)`}
      </Table.Cell>
    )
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
                    throughput.lastUpdated ? moment(throughput.lastUpdated).format('HH:mm:ss MM-DD-YYYY') : 'unknown'
                  }`}
                  {throughput.status === 'RECALCULATING' && (
                    <Label content="Recalculating! Refresh page in a few minutes" color="red" />
                  )}
                </Header.Subheader>
              )}
            </Grid.Column>
            <Grid.Column>
              <InfoBox content={infotooltips.PopulationOverview.Overview} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Header>
      <Segment basic loading={loading}>
        <Table celled structured compact striped selectable className="fixed-header">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell rowSpan="2">Year</Table.HeaderCell>
              {renderStudentsHeader()}
              <Table.HeaderCell colSpan={GRADUATED_FEATURE_TOGGLED_ON ? '3' : '1'}>Graduated</Table.HeaderCell>

              <Table.HeaderCell rowSpan="2">Transferred to this program</Table.HeaderCell>
              <Table.HeaderCell colSpan="5">Credits</Table.HeaderCell>
              {(thesisTypes.includes('BACHELOR') || thesisTypes.includes('MASTER')) && (
                <Table.HeaderCell colSpan={thesisTypes.length}>Thesis</Table.HeaderCell>
              )}
            </Table.Row>

            <Table.Row>
              {renderGenders || renderRatioOfFinns ? <Table.HeaderCell content="Total" /> : null}
              {genders.map(gender => (
                <Table.HeaderCell key={gender} content={gender} />
              ))}
              {renderRatioOfFinns ? <Table.HeaderCell content="Finnish" /> : null}
              <Table.HeaderCell>Graduated overall</Table.HeaderCell>
              {GRADUATED_FEATURE_TOGGLED_ON && (
                <Fragment>
                  <Table.HeaderCell>Graduated in time</Table.HeaderCell>
                  <Table.HeaderCell>Graduation median time</Table.HeaderCell>
                </Fragment>
              )}
              <Table.HeaderCell content="≥ 30" />
              <Table.HeaderCell content="≥ 60" />
              <Table.HeaderCell content="≥ 90" />
              <Table.HeaderCell content="≥ 120" />
              <Table.HeaderCell content="≥ 150" />
              {thesisTypes.includes('MASTER') && <Table.HeaderCell content="Master" />}
              {thesisTypes.includes('BACHELOR') && <Table.HeaderCell content="Bachelor" />}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data
              .sort((year1, year2) => Number(year2.year.slice(0, 4)) - Number(year1.year.slice(0, 4)))
              .map(year => (
                <Table.Row key={year.year}>
                  <Table.Cell>
                    {year.year}
                    <PopulationStatisticsLink studyprogramme={studyprogramme} year={year.year}>
                      <Icon name="level up alternate" />
                    </PopulationStatisticsLink>
                  </Table.Cell>
                  <Table.Cell>{year.credits.length}</Table.Cell>
                  {genders.map(gender => (
                    <Table.Cell key={`${year.year} gender:${gender}`}>
                      {`${year.genders[gender] || 0} (${Math.floor(
                        (year.genders[gender] / year.credits.length) * 100
                      ) || 0}%)`}
                    </Table.Cell>
                  ))}
                  {renderRatioOfFinns && ratioOfFinnsIn(year)}
                  <Table.Cell>{year.graduated}</Table.Cell>
                  {GRADUATED_FEATURE_TOGGLED_ON && (
                    <Fragment>
                      <Table.Cell>{year.inTargetTime}</Table.Cell>
                      <Table.Cell>{year.medianGraduationTime ? `${year.medianGraduationTime} months` : '∞'}</Table.Cell>
                    </Fragment>
                  )}
                  <Table.Cell>{year.transferred}</Table.Cell>
                  {Object.keys(year.creditValues).map(creditKey => (
                    <Table.Cell key={`${year.year} credit:${creditKey}`}>{year.creditValues[creditKey]}</Table.Cell>
                  ))}
                  {thesisTypes.includes('MASTER') ? <Table.Cell>{year.thesisM}</Table.Cell> : null}
                  {thesisTypes.includes('BACHELOR') ? <Table.Cell>{year.thesisB}</Table.Cell> : null}
                </Table.Row>
              ))}
          </Table.Body>
          {throughput && throughput.totals ? (
            <Table.Footer>
              <Table.Row>
                <Table.HeaderCell style={{ fontWeight: 'bold' }}>Total</Table.HeaderCell>
                <Table.HeaderCell>{throughput.totals.students}</Table.HeaderCell>
                {Object.keys(throughput.totals.genders).map(genderKey => (
                  <Table.HeaderCell key={`${genderKey}total`}>
                    {`${throughput.totals.genders[genderKey]} (${Math.floor(
                      (throughput.totals.genders[genderKey] / throughput.totals.students) * 100
                    )}%)`}
                  </Table.HeaderCell>
                ))}
                {renderRatioOfFinns ? (
                  <Table.HeaderCell>
                    {`${throughput.totals.nationalities.Finland || 0} (${Math.floor(
                      (throughput.totals.nationalities.Finland / calculateTotalNationalities()) * 100
                    ) || 0}%)`}
                  </Table.HeaderCell>
                ) : null}
                <Table.HeaderCell>{throughput.totals.graduated}</Table.HeaderCell>
                {GRADUATED_FEATURE_TOGGLED_ON && (
                  <Fragment>
                    <Table.HeaderCell>{throughput.totals.inTargetTime}</Table.HeaderCell>
                    <Table.HeaderCell>
                      {throughput.totals.medianGraduationTime
                        ? `${throughput.totals.medianGraduationTime} months`
                        : '∞'}
                    </Table.HeaderCell>
                  </Fragment>
                )}
                <Table.HeaderCell>{throughput.totals.transferred}</Table.HeaderCell>
                {Object.keys(throughput.totals.credits).map(creditKey => (
                  <Table.HeaderCell key={`${creditKey}total`}>{throughput.totals.credits[creditKey]}</Table.HeaderCell>
                ))}
                {thesisTypes.includes('MASTER') ? (
                  <Table.HeaderCell>{throughput.totals.thesisM}</Table.HeaderCell>
                ) : null}
                {thesisTypes.includes('BACHELOR') ? (
                  <Table.HeaderCell>{throughput.totals.thesisB}</Table.HeaderCell>
                ) : null}
              </Table.Row>
            </Table.Footer>
          ) : null}
        </Table>
      </Segment>
    </React.Fragment>
  )
}

ThroughputTable.propTypes = {
  throughput: shape({
    lastUpdated: string,
    status: string,
    data: arrayOf(
      shape({
        year: string,
        credits: arrayOf(number),
        thesisM: number,
        thesisB: number,
        graduated: number
      })
    )
  }),
  thesis: arrayOf(
    shape({
      programmeCode: string,
      courseCode: string,
      thesisType: string,
      createdAt: string,
      updatedAt: string
    })
  ),
  studyprogramme: string.isRequired,
  loading: bool.isRequired,
  error: bool.isRequired,
  userRoles: arrayOf(string).isRequired
}

ThroughputTable.defaultProps = {
  throughput: null,
  thesis: undefined
}

const mapStateToProps = ({
  auth: {
    token: { roles }
  }
}) => ({ userRoles: getUserRoles(roles) })

export default connect(mapStateToProps)(ThroughputTable)
