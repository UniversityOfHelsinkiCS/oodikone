import React, { useState } from 'react'
import moment from 'moment'
import { Header, Table, Icon, Label, Segment, Dropdown, Button, Modal, Popup } from 'semantic-ui-react'
import { shape, number, arrayOf, bool, string, node } from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { flatten, uniq, range } from 'lodash'
import { getUserRoles } from '../../../common'
import InfoBox from '../../InfoBox'
import infotooltips from '../../../common/InfoToolTips'

const getMonths = year => {
  const end = moment()
  const lastDayOfMonth = moment(end).endOf('month')
  const start = `${year}-08-01`
  return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
}

const PopulationStatisticsLink = ({ studytrack, studyprogramme, year: yearLabel, children }) => {
  const year = Number(yearLabel.slice(0, 4))
  const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
  const href = studytrack
    ? `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"studyTrack"%3A"${studytrack}"%7D&year=${year}`
    : `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${year}`
  return (
    <Link title={`Population statistics of class ${yearLabel}`} to={href}>
      {children}
    </Link>
  )
}

const TotalPopulationLink = ({ confirm, years, studyprogramme, studytrack, children }) => {
  const confirmWrapper = e => {
    if (confirm) {
      // eslint-disable-next-line no-alert
      const c = window.confirm(
        `Are you sure you want to see a combined population of ${years.length} different populations?`
      )
      if (!c) e.preventDefault()
    }
  }
  const yearsString = years.map(year => year.value).join('&years=')
  const months = getMonths(Math.min(...years.map(year => Number(year.value))))
  const href = studytrack
    ? `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%2C"studyTrack"%3A"${studytrack}"%7D&year=${years[0].value}&years=${yearsString}`
    : `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${years[0].value}&years=${yearsString}`
  return (
    <Link onClick={confirmWrapper} title="Population statistics of all years" to={href}>
      {children}
    </Link>
  )
}

PopulationStatisticsLink.propTypes = {
  studytrack: string.isRequired,
  studyprogramme: string.isRequired,
  year: string.isRequired,
  children: node.isRequired,
}

TotalPopulationLink.defaultProps = {
  confirm: false,
}

TotalPopulationLink.propTypes = {
  studyprogramme: string.isRequired,
  years: arrayOf(shape({})).isRequired,
  children: node.isRequired,
  confirm: bool,
  studytrack: string.isRequired,
}

const ThroughputTable = ({
  throughput,
  thesis,
  loading,
  error,
  studyprogramme,
  studytrack,
  userRoles,
  history,
  newProgramme,
  isStudytrackView,
}) => {
  const [lowerYear, setLower] = useState(null)
  const [upperYear, setUpper] = useState(null)
  const [yearDifference, setDifference] = useState(null)

  const data = throughput && throughput.data ? throughput.data.filter(year => year.credits.length > 0) : []

  const years =
    data && !isStudytrackView
      ? data
          .map(stats => ({
            key: stats.year.substring(0, 4),
            text: stats.year,
            value: stats.year.substring(0, 4),
          }))
          .sort((year1, year2) => Number(year2.value) - Number(year1.value))
      : []

  if (error) return <h1>Oh no so error {error}</h1>

  const GRADUATED_FEATURE_TOGGLED_ON = userRoles.includes('dev')

  const genders = data.length > 0 ? uniq(flatten(data.map(year => Object.keys(year.genders)))) : []
  genders.sort()

  const renderGenders = genders.length > 0

  const calculateTotalNationalities = () =>
    data.length > 0 ? Object.values(throughput.totals.nationalities).reduce((res, curr) => res + curr, 0) : 0

  const renderRatioOfFinns = calculateTotalNationalities() > 0
  let thesisTypes = []
  if (thesis) {
    thesisTypes = thesis.map(t => t.thesisType)
  }

  const handleLowerBoundChange = (event, { value }) => {
    event.preventDefault()
    if (Number(value) > Number(upperYear)) {
      setUpper(value)
      setLower(value)
      setDifference(1)
    } else if (Number(upperYear) - Number(value) > 5) {
      setUpper(String(Number(value) + 5))
      setLower(value)
      setDifference(6)
    } else {
      setLower(value)
      setDifference(Number(upperYear) - Number(value) + 1)
    }
  }

  const handleUpperBoundChange = (event, { value }) => {
    event.preventDefault()
    if (Number(value) < Number(lowerYear)) {
      setUpper(value)
      setLower(value)
      setDifference(1)
    } else if (Number(value) - Number(lowerYear) > 5) {
      setLower(String(Number(value) - 5))
      setUpper(value)
      setDifference(6)
    } else {
      setUpper(value)
      setDifference(Number(value) - Number(lowerYear) + 1)
    }
  }

  const pushQueryToUrl = event => {
    event.preventDefault()
    const yearRange = range(Number(lowerYear), Number(upperYear) + 1)
    const months = getMonths(Number(lowerYear))
    const yearsString = yearRange.join('&years=')

    if (yearRange.length > 1) {
      history.push(
        `/populations?months=${months}&semesters=FALL&semesters=` +
          `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${lowerYear}&years=${yearsString}`
      )
    } else {
      history.push(
        `/populations?months=${months}&semesters=FALL&semesters=` +
          `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${lowerYear}&years[]=${yearsString}`
      )
    }
  }

  const headerCellPopUp = (title, cell) => {
    return (
      <Popup trigger={cell} wide="very" position="left center">
        <Popup.Content>{infotooltips.PopulationOverview[title]}</Popup.Content>
      </Popup>
    )
  }

  const renderStudentsHeader = () => {
    let colSpan = 4
    let rowSpan = 1

    if (renderGenders) colSpan += genders.length
    if (renderRatioOfFinns) colSpan += 1
    if (!renderGenders && !renderRatioOfFinns) rowSpan += 1

    return headerCellPopUp(
      'Students',
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
    <>
      <div style={{ marginTop: '2em' }}>
        <InfoBox content={infotooltips.PopulationOverview.Overview} />
      </div>
      <Header>
        {studytrack ? `Population progress for selected studytrack` : 'Population progress'}
        {throughput && (
          <Header.Subheader data-cy="throughputUpdateStatus">
            {`Last updated ${
              throughput.lastUpdated ? moment(throughput.lastUpdated).format('HH:mm:ss MM-DD-YYYY') : 'unknown'
            }`}
            {throughput.status === 'RECALCULATING' && (
              <Label content="Recalculating! Refresh page in a few minutes" color="red" />
            )}
          </Header.Subheader>
        )}
      </Header>
      <Segment basic loading={loading} style={{ overflowX: 'auto' }}>
        <Table celled structured compact striped selectable className="fixed-header">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell rowSpan="2">{isStudytrackView ? 'Studytrack' : 'Year'}</Table.HeaderCell>
              {renderStudentsHeader()}

              {headerCellPopUp(
                'Graduated',
                <Table.HeaderCell colSpan={GRADUATED_FEATURE_TOGGLED_ON ? '3' : '1'}>Graduated</Table.HeaderCell>
              )}
              {headerCellPopUp('Credits', <Table.HeaderCell colSpan="5">Credits</Table.HeaderCell>)}
              {(thesisTypes.includes('BACHELOR') || thesisTypes.includes('MASTER')) &&
                headerCellPopUp('Thesis', <Table.HeaderCell colSpan={thesisTypes.length}>Thesis</Table.HeaderCell>)}
            </Table.Row>

            <Table.Row>
              {renderGenders || renderRatioOfFinns ? <Table.HeaderCell content="All" /> : null}
              {genders.map(gender => (
                <Table.HeaderCell key={gender} content={gender} />
              ))}
              {renderRatioOfFinns ? <Table.HeaderCell content="Finnish" /> : null}
              {headerCellPopUp(
                'Started',
                <Table.HeaderCell rowSpan="2" colSpan="1">
                  Started
                </Table.HeaderCell>
              )}
              {headerCellPopUp(
                'Transferred',
                <Table.HeaderCell rowSpan="2" colSpan="1">
                  Transferred to
                </Table.HeaderCell>
              )}
              {headerCellPopUp(
                'Cancelled',
                <Table.HeaderCell rowSpan="2" colSpan="1">
                  Cancelled
                </Table.HeaderCell>
              )}
              <Table.HeaderCell>Graduated overall</Table.HeaderCell>
              {GRADUATED_FEATURE_TOGGLED_ON && (
                <>
                  <Table.HeaderCell>Graduated in time</Table.HeaderCell>
                  <Table.HeaderCell>Graduation median time</Table.HeaderCell>
                </>
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
                    {!isStudytrackView && (
                      <PopulationStatisticsLink
                        studytrack={studytrack}
                        studyprogramme={studyprogramme}
                        year={year.year}
                      >
                        <Icon name="level up alternate" />
                      </PopulationStatisticsLink>
                    )}
                  </Table.Cell>
                  <Table.Cell>{year.credits.length}</Table.Cell>
                  {genders.map(gender => (
                    <Table.Cell key={`${year.year} gender:${gender}`}>
                      {`${year.genders[gender] || 0} (${
                        Math.floor((year.genders[gender] / year.credits.length) * 100) || 0
                      }%)`}
                    </Table.Cell>
                  ))}
                  {renderRatioOfFinns && ratioOfFinnsIn(year)}
                  <Table.Cell>{year.started}</Table.Cell>
                  <Table.Cell>{year.transferred}</Table.Cell>
                  <Table.Cell>{year.cancelled}</Table.Cell>
                  <Table.Cell>{year.graduated}</Table.Cell>

                  {GRADUATED_FEATURE_TOGGLED_ON && (
                    <>
                      <Table.Cell>{year.inTargetTime}</Table.Cell>
                      <Table.Cell>{year.medianGraduationTime ? `${year.medianGraduationTime} months` : '∞'}</Table.Cell>
                    </>
                  )}

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
                <Table.HeaderCell style={{ fontWeight: 'bold' }}>
                  All{' '}
                  {newProgramme && !isStudytrackView && years.length > 0 && years.length < 5 ? (
                    <TotalPopulationLink confirm studyprogramme={studyprogramme} studytrack={studytrack} years={years}>
                      <Icon name="level up alternate" />
                    </TotalPopulationLink>
                  ) : null}
                </Table.HeaderCell>
                <Table.HeaderCell>{throughput.totals.students}</Table.HeaderCell>
                {Object.keys(throughput.totals.genders)
                  .sort()
                  .map(genderKey => (
                    <Table.HeaderCell key={`${genderKey}total`}>
                      {`${throughput.totals.genders[genderKey]} (${Math.floor(
                        (throughput.totals.genders[genderKey] / throughput.totals.students) * 100
                      )}%)`}
                    </Table.HeaderCell>
                  ))}
                {renderRatioOfFinns ? (
                  <Table.HeaderCell>
                    {`${throughput.totals.nationalities.Finland || 0} (${
                      Math.floor((throughput.totals.nationalities.Finland / calculateTotalNationalities()) * 100) || 0
                    }%)`}
                  </Table.HeaderCell>
                ) : null}
                <Table.HeaderCell>{throughput.totals.started}</Table.HeaderCell>
                <Table.HeaderCell>{throughput.totals.transferred}</Table.HeaderCell>
                <Table.HeaderCell>{throughput.totals.cancelled}</Table.HeaderCell>
                <Table.HeaderCell>{throughput.totals.graduated}</Table.HeaderCell>
                {GRADUATED_FEATURE_TOGGLED_ON && (
                  <>
                    <Table.HeaderCell>{throughput.totals.inTargetTime}</Table.HeaderCell>
                    <Table.HeaderCell>
                      {throughput.totals.medianGraduationTime
                        ? `${throughput.totals.medianGraduationTime} months`
                        : '∞'}
                    </Table.HeaderCell>
                  </>
                )}
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
      {years.length > 4 ? (
        <>
          Statistics from:
          <Dropdown selection options={years} onChange={handleLowerBoundChange} value={lowerYear} />
          to:
          <Dropdown selection options={years} onChange={handleUpperBoundChange} value={upperYear} />
          <Modal
            trigger={<Button disabled={!lowerYear || !upperYear}>Show combined population</Button>}
            header={`Are you sure you want to see a combined population of ${yearDifference} different populations?`}
            actions={[
              'Cancel',
              {
                key: 'fetch',
                content: 'Show population',
                positive: true,
                onClick: event => pushQueryToUrl(event),
              },
            ]}
          />
        </>
      ) : null}
    </>
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
        graduated: number,
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
  studyprogramme: string.isRequired,
  studytrack: string,
  loading: bool.isRequired,
  error: bool.isRequired,
  userRoles: arrayOf(string).isRequired,
  history: shape({}).isRequired,
  newProgramme: bool.isRequired,
  isStudytrackView: bool,
}

ThroughputTable.defaultProps = {
  throughput: null,
  thesis: undefined,
  studytrack: '',
  isStudytrackView: false,
}

const mapStateToProps = ({
  auth: {
    token: { roles },
  },
}) => ({ userRoles: getUserRoles(roles) })

export default connect(mapStateToProps)(ThroughputTable)
