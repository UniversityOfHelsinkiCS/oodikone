import { sortBy } from 'lodash'
import { func, shape, string } from 'prop-types'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { Button, Divider, Header, Icon, Item, Popup, Segment, Table } from 'semantic-ui-react'

import { calculatePercentage, getTargetCreditsForProgramme, reformatDate } from '@/common'
import { studentToolTips } from '@/common/InfoToolTips'
import { HoverableHelpPopup } from '@/components/common/HoverableHelpPopup'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetProgrammesQuery } from '@/redux/populations'

export const StudyrightsTable = ({ handleStartDateChange, showPopulationStatistics, student, studyrightid }) => {
  const { getTextIn } = useLanguage()
  const { data: programmesAndStudyTracks } = useGetProgrammesQuery()
  const programmes = programmesAndStudyTracks?.programmes

  const programmeCodes = programmes ? Object.keys(programmes) : []
  const studyRightHeaders = ['Programme', 'Study track', 'Status', 'Completed']

  if (!student) return null

  const studyRightRows = student.studyrights
    .filter(studyright => studyright.studyright_elements.length > 0)
    .map(studyright => {
      const programmes = sortBy(studyright.studyright_elements, 'enddate')
        .filter(element => element.element_detail.type === 20)
        .map(programme => ({
          code: programme.code,
          startdate: programme.startdate ?? studyright.studystartdate,
          studystartdate: studyright.studystartdate,
          enddate: programme.enddate,
          name: getTextIn(programme.element_detail.name),
          isFilterable:
            !studyright.cancelled &&
            student.studyplans.map(plan => plan.programme_code).includes(programme.element_detail.code),
        }))
      const studytracks = sortBy(studyright.studyright_elements, 'enddate')
        .filter(element => element.element_detail.type === 30)
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

  if (studyRightRows.length === 0) return null

  const filterDuplicates = (elem1, _index, array) => {
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

  const renderStatus = studyright => {
    if (studyright.cancelled)
      return (
        <div style={{ display: 'flex' }}>
          <p style={{ color: 'black', fontWeight: 'bolder' }}>CANCELLED</p>
        </div>
      )
    if (studyright.graduated)
      return (
        <div>
          <p style={{ color: 'green', fontWeight: 'bolder', marginBottom: 0 }}>GRADUATED</p>
          <p style={{ color: 'grey', marginTop: 0 }}>{reformatDate(studyright.enddate, 'DD.MM.YYYY')}</p>
        </div>
      )
    if (studyright.active)
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

  const getActualStartDate = studyright =>
    new Date(studyright.startdate).getTime() > new Date(studyright.studystartdate).getTime()
      ? studyright.startdate
      : studyright.studystartdate

  // End dates of study rights are semi-open intervals, subtract 1 day to get acual end date
  const getAcualEndDate = (endDate, graduated) => {
    if (!endDate) return null
    if (graduated) return new Date(endDate)
    return new Date(new Date(endDate).setDate(new Date(endDate).getDate() - 1))
  }

  const renderProgrammes = studyright =>
    sortBy(studyright.elements.programmes.filter(filterDuplicates), 'startdate')
      .reverse()
      .map(programme => (
        <p key={`${programme.name}-${programme.startdate}`}>
          {`${programme.name} (${reformatDate(getActualStartDate(programme), 'DD.MM.YYYY')} - ${reformatDate(
            getAcualEndDate(programme.enddate, studyright.graduated),
            'DD.MM.YYYY'
          )})`}
          {programmeCodes.includes(programme.code) && (
            <Item as={Link} to={showPopulationStatistics(programme.code, programme.startdate)}>
              <Icon name="level up alternate" />
            </Item>
          )}
        </p>
      ))

  const renderStudytracks = studyright => {
    const studytracks = studyright.elements.studytracks.filter(filterDuplicates)

    return sortBy(studyright.elements.programmes.filter(filterDuplicates), 'startdate')
      .reverse()
      .map(programme => {
        const studytrack = studytracks.find(studytrack => studytrack.startdate === programme.startdate)

        return studytrack ? (
          <p key={`${studytrack.name}-${studytrack.startdate}`}>
            {`${studytrack.name} (${reformatDate(studytrack.startdate, 'DD.MM.YYYY')} - ${reformatDate(
              getAcualEndDate(studytrack.enddate, studyright.graduated),
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

  const renderCompletionPercent = (studyright, student) => {
    const programmeCodes = studyright.elements.programmes.filter(filterDuplicates).map(programme => programme.code)
    const studyplan = student.studyplans.find(
      studyplan =>
        programmeCodes.includes(studyplan.programme_code) && studyplan.studyrightid === studyright.studyrightid
    )
    if (!studyplan) return <>-</>

    const { completed_credits: completedCredits } = studyplan
    const credits = completedCredits || 0
    if (studyright.graduated) return `${credits} cr`
    const totalCredits = getTargetCreditsForProgramme(programmeCodes[0])
    const completedPercentage = calculatePercentage(credits, totalCredits, 0)
    return `${completedPercentage} (${credits} cr)`
  }

  return (
    <Segment basic>
      <Divider horizontal>
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
                  <HoverableHelpPopup
                    content={<ReactMarkdown>{studentToolTips.StudyrightStatus}</ReactMarkdown>}
                    size="mini"
                    style={{ marginLeft: '0.25rem' }}
                  />
                )}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {studyRightRows.map(studyright => {
            if (studyright.elements.programmes.length > 0) {
              const rowIsFilterable = studyright.elements.programmes.some(programme => programme.isFilterable)
              return (
                <Table.Row
                  key={studyright.studyrightid}
                  onClick={() =>
                    rowIsFilterable ? handleStartDateChange(studyright.elements, studyright.studyrightid) : null
                  }
                  style={{ cursor: rowIsFilterable ? 'pointer' : 'not-allowed' }}
                >
                  <Table.Cell>
                    <Popup
                      content={
                        rowIsFilterable
                          ? 'Display credits included in the study plan of this study right'
                          : 'This study right does not have a study plan'
                      }
                      size="mini"
                      trigger={
                        <div>
                          <Button
                            basic={studyright.studyrightid !== studyrightid}
                            disabled={!rowIsFilterable}
                            icon
                            onClick={() => handleStartDateChange(studyright.elements, studyright.studyrightid)}
                            primary={studyright.studyrightid === studyrightid}
                            size="mini"
                          >
                            <Icon name="filter" />
                          </Button>
                        </div>
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>{studyright.elements.programmes.length > 0 && renderProgrammes(studyright)}</Table.Cell>
                  <Table.Cell>{renderStudytracks(studyright)}</Table.Cell>
                  <Table.Cell>{renderStatus(studyright)}</Table.Cell>
                  <Table.Cell>{renderCompletionPercent(studyright, student)}</Table.Cell>
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
  student: shape({}).isRequired,
  handleStartDateChange: func.isRequired,
  showPopulationStatistics: func.isRequired,
  studyrightid: string,
}
