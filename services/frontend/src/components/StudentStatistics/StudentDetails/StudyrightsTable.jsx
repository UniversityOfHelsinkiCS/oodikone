import { orderBy } from 'lodash'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { Button, Divider, Header, Icon, Item, Popup, Table } from 'semantic-ui-react'

import { calculatePercentage, getTargetCreditsForProgramme } from '@/common'
import { useCurrentSemester } from '@/common/hooks'
import { studentToolTips } from '@/common/InfoToolTips'
import { HoverableHelpPopup } from '@/components/common/HoverableHelpPopup'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useGetProgrammesQuery } from '@/redux/populations'
import { reformatDate } from '@/util/timeAndDate'

const studyRightIsActive = (studyRight, currentSemester) =>
  studyRight.semesterEnrollments?.find(({ type, semester }) => semester === currentSemester && [1, 2].includes(type)) !=
  null

export const StudyrightsTable = ({ handleStudyPlanChange, student, selectedStudyPlanId }) => {
  const { getTextIn } = useLanguage()
  const { data: studyProgrammes } = useGetProgrammesQuery()
  const { semestercode: currentSemesterCode } = useCurrentSemester()

  const studyRightHeaders = ['Programme', 'Study track', 'Status', 'Completed']

  if (!student) return null

  // Study right elements are sorted by end date in descending order in the backend so the newest programme is the first one
  const formatStudyRightRow = (studyRight, phase, programmes) => {
    const studyPlanId = student.studyplans.find(
      plan => plan.sis_study_right_id === studyRight.id && plan.programme_code === programmes[0].code
    )?.id
    return {
      key: `${studyRight.id}-${phase}`,
      studyRightId: studyRight.id,
      graduated: programmes[0].graduated,
      endDate: programmes[0].endDate,
      studyPlanId,
      active: studyRightIsActive(studyRight, currentSemesterCode),
      cancelled: studyRight.cancelled,
      programmes,
    }
  }

  const studyRightRows = orderBy(
    student.studyRights.flatMap(studyRight => {
      // Phases 1 and 2 (usually bachelor and master) are still separated as different rows, even though they're now under the same study right
      const phase1Programmes = studyRight.studyRightElements.filter(({ phase }) => phase === 1)
      const phase2Programmes = studyRight.studyRightElements.filter(({ phase }) => phase === 2)

      const result = [formatStudyRightRow(studyRight, 1, phase1Programmes)]

      if (phase2Programmes.length > 0) result.push(formatStudyRightRow(studyRight, 2, phase2Programmes))
      return result
    }),
    ['endDate'],
    ['desc']
  )

  if (studyRightRows.length === 0) return null

  const renderStatus = studyright => {
    let text = <div style={{ color: 'red', fontWeight: 'bolder' }}>INACTIVE</div>

    if (studyright.graduated) {
      text = (
        <>
          <div style={{ color: 'green', fontWeight: 'bolder' }}>GRADUATED</div>
          <div style={{ color: 'grey' }}>{reformatDate(studyright.endDate, DISPLAY_DATE_FORMAT)}</div>
        </>
      )
    } else if (studyright.active) {
      text = <div style={{ color: 'blue', fontWeight: 'bolder' }}>ACTIVE</div>
    } else if (studyright.cancelled) {
      text = <div style={{ color: 'black', fontWeight: 'bolder' }}>CANCELLED</div>
    }

    return <div style={{ display: 'flex', flexDirection: 'column' }}>{text}</div>
  }

  const renderCompletionPercent = (studyright, student) => {
    const newestProgrammeCode = studyright.programmes[0].code
    const studyPlan = student.studyplans.find(
      studyPlan =>
        newestProgrammeCode === studyPlan.programme_code && studyPlan.sis_study_right_id === studyright.studyRightId
    )
    if (!studyPlan) return <>-</>

    const { completed_credits: credits = 0 } = studyPlan
    if (studyright.graduated) return `${credits} cr`
    const totalCredits = getTargetCreditsForProgramme(newestProgrammeCode)
    const completedPercentage = calculatePercentage(credits, totalCredits, 0)
    return `${completedPercentage} (${credits} cr)`
  }

  const showPopulationStatistics = (studyprogramme, date) => {
    const year = moment(date).isBefore(moment(`${date.slice(0, 4)}-08-01`)) ? date.slice(0, 4) - 1 : date.slice(0, 4)
    const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
    return `/populations?months=${months}&semesters=FALL&semesters=SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${year}`
  }

  return (
    <>
      <Divider horizontal style={{ margin: '2em 0' }}>
        <Header as="h4">Filter credits by study right</Header>
      </Divider>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell />
            {studyRightHeaders.map(header => (
              <Table.HeaderCell key={header}>
                {header}
                {header === 'Status' && (
                  <HoverableHelpPopup
                    content={studentToolTips.studyRightStatus}
                    size="mini"
                    style={{ marginLeft: '0.25rem' }}
                  />
                )}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {studyRightRows.map(studyRight => {
            const numberOfProgrammes = studyRight.programmes.length
            const rowIsFilterable = studyRight.studyPlanId != null

            return studyRight.programmes.map(({ name, startDate, endDate, code, studyTrack }, index) => {
              const isFirstRow = index === 0
              return (
                <Table.Row
                  key={`${studyRight.key}-${code}`}
                  onClick={() => (rowIsFilterable ? handleStudyPlanChange(studyRight.studyPlanId) : null)}
                  style={{ cursor: rowIsFilterable ? 'pointer' : 'not-allowed' }}
                >
                  {isFirstRow && (
                    <Table.Cell rowSpan={numberOfProgrammes}>
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
                              basic={studyRight.studyPlanId !== selectedStudyPlanId}
                              disabled={!rowIsFilterable}
                              icon
                              onClick={() => handleStudyPlanChange(studyRight.studyPlanId)}
                              primary={studyRight.studyPlanId === selectedStudyPlanId}
                              size="mini"
                            >
                              <Icon name="filter" />
                            </Button>
                          </div>
                        }
                      />
                    </Table.Cell>
                  )}
                  <Table.Cell style={{ border: !isFirstRow && 'none' }}>
                    {`${getTextIn(name)} (${reformatDate(startDate, DISPLAY_DATE_FORMAT)}–${reformatDate(endDate, DISPLAY_DATE_FORMAT)})`}
                    {studyProgrammes != null && code in studyProgrammes && (
                      <Item as={Link} to={showPopulationStatistics(code, startDate)}>
                        <Icon name="level up alternate" />
                      </Item>
                    )}
                  </Table.Cell>
                  <Table.Cell style={{ border: !isFirstRow && 'none' }}>
                    {studyTrack && <div>{`${getTextIn(studyTrack.name)}`}</div>}
                  </Table.Cell>
                  {isFirstRow && <Table.Cell rowSpan={numberOfProgrammes}>{renderStatus(studyRight)}</Table.Cell>}
                  {isFirstRow && (
                    <Table.Cell rowSpan={numberOfProgrammes}>{renderCompletionPercent(studyRight, student)}</Table.Cell>
                  )}
                </Table.Row>
              )
            })
          })}
        </Table.Body>
      </Table>
    </>
  )
}
