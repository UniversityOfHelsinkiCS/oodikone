import { FilterAlt as FilterAltIcon, NorthEast as NorthEastIcon } from '@mui/icons-material'
import { TableBody, TableCell, TableHead, TableRow, Tooltip, IconButton, Stack } from '@mui/material'
import { blue } from '@mui/material/colors'
import { orderBy } from 'lodash'
import moment from 'moment'
import { Link } from 'react-router'

import { calculatePercentage, getTargetCreditsForProgramme } from '@/common'
import { studentToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { StyledTable } from '@/components/material/StyledTable'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useCurrentSemester } from '@/hooks/currentSemester'
import { useGetProgrammesQuery } from '@/redux/populations'
import { reformatDate } from '@/util/timeAndDate'

const studyRightIsActive = (studyRight, currentSemester) =>
  studyRight.semesterEnrollments?.find(({ type, semester }) => semester === currentSemester && [1, 2].includes(type)) !=
  null

export const StudyrightsTable = ({ handleStudyPlanChange, student, selectedStudyPlanId }) => {
  const { getTextIn } = useLanguage()
  const { data: studyProgrammes } = useGetProgrammesQuery()
  const currentSemester = useCurrentSemester()
  const currentSemesterCode = currentSemester?.semestercode

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
    if (!studyPlan) return null

    const { completed_credits: credits = 0 } = studyPlan
    if (studyright.graduated) return `${credits} cr`
    const totalCredits = getTargetCreditsForProgramme(newestProgrammeCode)
    const completedPercentage = calculatePercentage(credits, totalCredits, 0)
    return `${completedPercentage} (${credits} cr)`
  }

  const showPopulationStatistics = (studyprogramme: string, date: string) => {
    const yearFromDate = parseInt(date.slice(0, 4), 10)
    const year = moment(date).isBefore(`${yearFromDate}-08-01`, 'day') ? yearFromDate - 1 : yearFromDate
    const months = Math.ceil(moment().diff(`${year}-08-01`, 'months', true))
    return `/populations?months=${months}&semesters=FALL&semesters=SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${year}`
  }

  return (
    <Section
      cypress="study-rights"
      infoBoxContent="To filter the credits shown in the **Credit graph** by study right, click the filter icon next to the corresponding row in the table below. When a study right is selected, courses included in that study right's study plan are also highlighted with a light blue background in the **Courses** table."
      title="Study rights"
    >
      <StyledTable>
        <TableHead>
          <TableRow>
            <TableCell width="50px" />
            <TableCell>Programme</TableCell>
            <TableCell>Study track</TableCell>
            <TableCell>
              <TableHeaderWithTooltip header="Status" tooltipText={studentToolTips.studyRightStatus} />
            </TableCell>
            <TableCell>Completed</TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          sx={{
            '& .MuiTableRow-root:hover': {
              backgroundColor: 'inherit',
            },
          }}
        >
          {studyRightRows.map(studyRight => {
            const numberOfProgrammes = studyRight.programmes.length
            const rowIsFilterable = studyRight.studyPlanId != null

            return studyRight.programmes.map(({ name, startDate, endDate, code, studyTrack }, index) => {
              const isFirstRow = index === 0
              const isLastRow = index === numberOfProgrammes - 1

              return (
                <TableRow
                  key={`${studyRight.key}-${code}`}
                  onClick={() => (rowIsFilterable ? handleStudyPlanChange(studyRight.studyPlanId) : null)}
                  style={{
                    cursor: rowIsFilterable ? 'pointer' : 'not-allowed',
                    borderWidth: `0 1px ${isLastRow ? '1px' : '0'} 1px`, // Bottom border only for the last programme in the study right
                    backgroundColor: studyRight.studyPlanId === selectedStudyPlanId ? blue[50] : 'inherit',
                  }}
                >
                  {isFirstRow && (
                    <TableCell rowSpan={numberOfProgrammes}>
                      <Tooltip
                        arrow
                        title={
                          rowIsFilterable
                            ? 'Display credits included in the study plan of this study right'
                            : 'This study right does not have a study plan'
                        }
                      >
                        <div>
                          <IconButton
                            color={studyRight.studyPlanId === selectedStudyPlanId ? 'primary' : 'default'}
                            disabled={!rowIsFilterable}
                            onClick={() => handleStudyPlanChange(studyRight.studyPlanId)}
                            size="small"
                            sx={{
                              borderRadius: 2,
                              border: rowIsFilterable ? '1px solid rgba(0, 0, 0, 0.23)' : 'none',
                            }}
                          >
                            <FilterAltIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell>
                    <Stack alignItems="center" direction="row">
                      {`${getTextIn(name)} (${reformatDate(startDate, DISPLAY_DATE_FORMAT)}–${reformatDate(endDate, DISPLAY_DATE_FORMAT)})`}
                      {studyProgrammes != null && code in studyProgrammes && (
                        <IconButton
                          color="primary"
                          component={Link}
                          size="small"
                          to={showPopulationStatistics(code, startDate)}
                        >
                          <NorthEastIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{getTextIn(studyTrack?.name)}</TableCell>
                  {isFirstRow && <TableCell rowSpan={numberOfProgrammes}>{renderStatus(studyRight)}</TableCell>}
                  {isFirstRow && (
                    <TableCell rowSpan={numberOfProgrammes}>{renderCompletionPercent(studyRight, student)}</TableCell>
                  )}
                </TableRow>
              )
            })
          })}
        </TableBody>
      </StyledTable>
    </Section>
  )
}
