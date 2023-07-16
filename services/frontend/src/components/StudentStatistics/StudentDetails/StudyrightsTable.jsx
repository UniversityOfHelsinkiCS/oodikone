import React from 'react'
import { func, shape, string } from 'prop-types'
import { Divider, Table, Icon, Header, Item, Segment, Button, Popup } from 'semantic-ui-react'
import { sortBy } from 'lodash'
import { Link } from 'react-router-dom'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { reformatDate, getTargetCreditsForProgramme } from '../../../common'

const StudyrightsTable = ({ Programmes, student, handleStartDateChange, showPopulationStatistics, studyrightid }) => {
  const { getTextIn } = useLanguage()
  const { programmes } = Programmes
  const programmeCodes = programmes ? Object.keys(programmes) : []
  const studyRightHeaders = ['Programme', 'Study Track', 'Status', 'Completed']

  if (!student) return null

  const studyRightRows = student.studyrights.map(studyright => {
    const programmes = sortBy(studyright.studyright_elements, 'enddate')
      .filter(e => e.element_detail.type === 20)
      .map(programme => ({
        code: programme.code,
        startdate: programme.startdate,
        studystartdate: studyright.studystartdate,
        enddate: programme.enddate,
        name: getTextIn(programme.element_detail.name),
        isFilterable:
          !studyright.cancelled &&
          student.studyplans.map(plan => plan.programme_code).includes(programme.element_detail.code),
      }))
    const studytracks = sortBy(studyright.studyright_elements, 'enddate')
      .filter(e => e.element_detail.type === 30)
      .map(studytrack => ({
        startdate: studytrack.startdate,
        enddate: studytrack.enddate,
        name: getTextIn(studytrack.element_detail.name),
      }))
    return {
      studyrightid: studyright.studyrightid,
      graduated: studyright.graduated,
      enddate: studyright.enddate,
      active: studyright.active,
      cancelled: studyright.cancelled,
      elements: { programmes, studytracks },
    }
  })

  const filterDuplicates = (elem1, index, array) => {
    for (let i = 0; i < array.length; i++) {
      const elem2 = array[i]
      if (
        elem1.name === elem2.name &&
        ((elem1.startdate > elem2.startdate && elem1.enddate <= elem2.enddate) ||
          (elem1.enddate < elem2.enddate && elem1.startdate >= elem2.startdate))
      ) {
        return false
      }
    }
    return true
  }

  const renderStatus = c => {
    if (c.cancelled)
      return (
        <div style={{ display: 'flex' }}>
          <p style={{ color: 'black', fontWeight: 'bolder' }}>CANCELLED</p>
        </div>
      )
    if (c.graduated)
      return (
        <div>
          <p style={{ color: 'green', fontWeight: 'bolder', marginBottom: 0 }}>GRADUATED</p>
          <p style={{ color: 'grey', marginTop: 0 }}>{reformatDate(c.enddate, 'DD.MM.YYYY')}</p>
        </div>
      )
    if (c.active)
      return (
        <div style={{ display: 'flex' }}>
          <p style={{ color: 'blue', fontWeight: 'bolder' }}>ACTIVE</p>
        </div>
      )
    return (
      <div style={{ display: 'flex' }}>
        <p style={{ color: 'red', fontWeight: 'bolder' }}>INACTIVE</p>
      </div>
    )
  }

  const getActualStartDate = c =>
    new Date(c.startdate).getTime() > new Date(c.studystartdate).getTime() ? c.startdate : c.studystartdate

  // End dates of study rights are semi-open intervals, subtract 1 day to get acual end date
  const getAcualEndDate = (endDate, graduated) => {
    if (!endDate) return null
    if (graduated) return new Date(endDate)
    return new Date(new Date(endDate).setDate(new Date(endDate).getDate() - 1))
  }

  const renderProgrammes = c =>
    sortBy(c.elements.programmes.filter(filterDuplicates), 'startdate')
      .reverse()
      .map(programme => (
        <p key={`${programme.name}-${programme.startdate}`}>
          {`${programme.name} (${reformatDate(getActualStartDate(programme), 'DD.MM.YYYY')} - ${reformatDate(
            getAcualEndDate(programme.enddate, c.graduated),
            'DD.MM.YYYY'
          )})`}
          {programmeCodes.includes(programme.code) && (
            <Item as={Link} to={showPopulationStatistics(programme.code, programme.startdate)}>
              <Icon name="level up alternate" />
            </Item>
          )}{' '}
          <br />
        </p>
      ))

  const renderStudytracks = c => {
    const studytracks = c.elements.studytracks.filter(filterDuplicates)

    return sortBy(c.elements.programmes.filter(filterDuplicates), 'startdate')
      .reverse()
      .map(programme => {
        const studytrack = studytracks.find(studytrack => studytrack.startdate === programme.startdate)

        return studytrack ? (
          <p key={`${studytrack.name}-${studytrack.startdate}`}>
            {`${studytrack.name} (${reformatDate(studytrack.startdate, 'DD.MM.YYYY')} - ${reformatDate(
              getAcualEndDate(studytrack.enddate, c.graduated),
              'DD.MM.YYYY'
            )})`}
            <br />
          </p>
        ) : (
          <p key={`empty-row-${Math.random()}`}>
            <br />
          </p>
        )
      })
  }

  const renderCompletionPercent = (c, student) => {
    const programmeCodes = c.elements.programmes.filter(filterDuplicates).map(programme => programme.code)
    const studyplan = student.studyplans.find(
      sp => programmeCodes.includes(sp.programme_code) && sp.studyrightid === c.studyrightid
    )
    if (!studyplan) return <>-</>

    const { completed_credits: completedCredits } = studyplan
    const credits = completedCredits || 0
    if (c.graduated) return `${credits}cr`
    const totalCredits = getTargetCreditsForProgramme(programmeCodes[0])
    const completedPercentage = `${(Math.min(1, credits / Math.max(totalCredits, 1)) * 100).toFixed(0)}%`
    return `${completedPercentage} (${credits}cr)`
  }

  return (
    <Segment basic>
      <Divider horizontal style={{ padding: '20px' }}>
        <Header as="h4">Filter credits by study right</Header>
      </Divider>
      <Table className="fixed-header">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell />
            {studyRightHeaders.map(header => (
              <Table.HeaderCell key={header}>
                {header}
                {header === 'Status' && (
                  <Popup
                    hoverable
                    content={
                      <>
                        <p style={{ marginBottom: 0 }}>
                          <strong>Active:</strong> Student is currently enrolled to the corresponding programme either
                          present or absent.
                        </p>
                        <p style={{ marginBottom: 0, marginTop: 0 }}>
                          <strong>Inactive:</strong> Student has not enrolled to the corresponding programme.
                        </p>
                        <p style={{ marginBottom: 0, marginTop: 0 }}>
                          <strong>Cancelled:</strong> Sturyright for the corresponding programme is cancelled.
                        </p>
                        <p style={{ marginTop: 0 }}>
                          <strong>Graduated:</strong> Student has graduated from the corresponding programme.
                        </p>
                      </>
                    }
                    size="mini"
                    trigger={<Icon name="question circle outline" />}
                  />
                )}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sortBy(studyRightRows, c => Number(c.studyrightid))
            .reverse()
            .map(c => {
              if (c.elements.programmes.length > 0) {
                const rowIsFilterable = c.elements.programmes.some(p => p.isFilterable)
                return (
                  <Table.Row
                    style={{ cursor: rowIsFilterable ? 'pointer' : 'not-allowed' }}
                    key={c.studyrightid}
                    onClick={() => (rowIsFilterable ? handleStartDateChange(c.elements, c.studyrightid) : null)}
                  >
                    <Table.Cell>
                      <Popup
                        content={
                          rowIsFilterable
                            ? `Display credits included in the study plan of this study right`
                            : 'This study right does not have a study plan'
                        }
                        size="mini"
                        trigger={
                          <div>
                            <Button
                              onClick={() => handleStartDateChange(c.elements, c.studyrightid)}
                              size="mini"
                              basic={c.studyrightid !== studyrightid}
                              primary={c.studyrightid === studyrightid}
                              disabled={!rowIsFilterable}
                              icon
                            >
                              <Icon name="filter" />
                            </Button>
                          </div>
                        }
                      />
                    </Table.Cell>
                    <Table.Cell>{c.elements.programmes.length > 0 && renderProgrammes(c)}</Table.Cell>
                    <Table.Cell>{renderStudytracks(c)}</Table.Cell>
                    <Table.Cell>{renderStatus(c)}</Table.Cell>
                    <Table.Cell>{renderCompletionPercent(c, student)}</Table.Cell>
                  </Table.Row>
                )
              }
              return null
            })}
        </Table.Body>
      </Table>
    </Segment>
  )
}

StudyrightsTable.defaultProps = {
  studyrightid: '',
}

StudyrightsTable.propTypes = {
  Programmes: shape({}).isRequired,
  student: shape({}).isRequired,
  handleStartDateChange: func.isRequired,
  showPopulationStatistics: func.isRequired,
  studyrightid: string,
}

export default StudyrightsTable
