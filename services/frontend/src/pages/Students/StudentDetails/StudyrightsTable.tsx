import FilterAltIcon from '@mui/icons-material/FilterAlt'
import NorthEastIcon from '@mui/icons-material/NorthEast'
import blue from '@mui/material/colors/blue'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'

import dayjs from 'dayjs'
import { orderBy } from 'lodash'

import { calculatePercentage, getTargetCreditsForProgramme } from '@/common'
import { studentToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Link } from '@/components/material/Link'
import { Section } from '@/components/material/Section'
import { StyledTable } from '@/components/material/StyledTable'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { DateFormat } from '@/constants/date'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { reformatDate } from '@/util/timeAndDate'
import { SISStudyRight, SISStudyRightElement } from '@oodikone/shared/models'
import { EnrollmentType, Phase } from '@oodikone/shared/types'
import { StudentPageStudent } from '@oodikone/shared/types/studentData'

// For the most part we calculate if studyright is active by checking for term registrations
// If study right doesn't have term registrations (non degree leading studyright) --
// the state should be based on studyright validity period, see issue #4795
const NON_DEGREE_LEADING_STUDY_RIGHT_URN = 'urn:code:study-right-expiration-rules:no-automatic-calculation'

const isBetweenDays = (startDate: Date | string, endDate: Date | string) => {
  const current = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  current.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return start <= current && current <= end
}

const getEnrollmentStatus = (
  studyRight: SISStudyRight,
  currentSemesterCode: number | undefined
): { present: boolean; absent: boolean } => {
  if (studyRight.expirationRuleUrns?.includes(NON_DEGREE_LEADING_STUDY_RIGHT_URN)) {
    const present = isBetweenDays(studyRight.startDate, studyRight.endDate)
    return { present, absent: false }
  }
  const enrollment = studyRight.semesterEnrollments?.find(({ semester }) => semester === currentSemesterCode)
  if (enrollment) {
    if (enrollment.type === EnrollmentType.PRESENT) return { present: true, absent: false }
    if (enrollment.type === EnrollmentType.ABSENT) return { present: false, absent: true }
  }
  return { present: false, absent: false }
}

export const StudyrightsTable = ({
  handleStudyPlanChange,
  student,
  selectedStudyPlanId,
}: {
  handleStudyPlanChange: (id: string | null) => void
  student: StudentPageStudent
  selectedStudyPlanId: string | null
}) => {
  const { getTextIn } = useLanguage()
  const { data: studyProgrammes } = useGetProgrammesQuery()
  const { data: semesters } = useGetSemestersQuery()
  const { currentSemester } = semesters ?? { currentSemester: null }

  if (!student) return null

  // Study right elements are sorted by end date in descending order in the backend so the newest programme is the first one
  const formatStudyRightRow = (studyRight: SISStudyRight, phase: Phase, programmes: SISStudyRightElement[]) => {
    const studyPlanId = student.studyplans.find(
      plan => plan.sis_study_right_id === studyRight.id && plan.programme_code === programmes[0].code
    )?.id
    const { present, absent } = getEnrollmentStatus(studyRight, currentSemester?.semestercode)
    return {
      key: `${studyRight.id}-${phase}`,
      studyRightId: studyRight.id,
      graduated: programmes[0].graduated,
      endDate: programmes[0].endDate,
      studyPlanId,
      active: present || absent,
      absent,
      cancelled: studyRight.cancelled,
      programmes,
    }
  }

  const studyRightRows = orderBy(
    student.studyRights.flatMap(studyRight => {
      // Phases 1 and 2 (usually bachelor and master) are still separated as different rows, even though they're now under the same study right
      const phase1Programmes = studyRight.studyRightElements.filter(({ phase }) => phase === Phase.ANY)
      const phase2Programmes = studyRight.studyRightElements.filter(({ phase }) => phase === Phase.MASTER)

      const result = [formatStudyRightRow(studyRight, Phase.ANY, phase1Programmes)]

      if (phase2Programmes.length > 0) result.push(formatStudyRightRow(studyRight, Phase.MASTER, phase2Programmes))
      return result
    }),
    ['endDate'],
    ['desc']
  )

  if (studyRightRows.length === 0) return null

  const RenderStatus = ({ studyRight }: { studyRight: (typeof studyRightRows)[number] }) => {
    let text = <span style={{ color: 'red', fontWeight: 'bolder' }}>INACTIVE</span>

    if (studyRight.graduated) {
      text = (
        <>
          <span style={{ color: 'green', fontWeight: 'bolder' }}>GRADUATED</span>
          <span style={{ color: 'grey' }}>{reformatDate(studyRight.endDate, DateFormat.DISPLAY_DATE)}</span>
        </>
      )
    } else if (studyRight.absent) {
      text = <span style={{ color: 'orange', fontWeight: 'bolder' }}>ABSENT</span>
    } else if (studyRight.active) {
      text = <span style={{ color: 'blue', fontWeight: 'bolder' }}>ACTIVE</span>
    } else if (studyRight.cancelled) {
      text = <span style={{ color: 'black', fontWeight: 'bolder' }}>CANCELLED</span>
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
    const year = dayjs(date).isBefore(`${yearFromDate}-08-01`, 'day') ? yearFromDate - 1 : yearFromDate
    const months = Math.ceil(dayjs().diff(`${year}-08-01`, 'months', true))
    return `/populations?months=${months}&semesters=FALL&semesters=SPRING&programme=${studyprogramme}&years=${year}`
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
                  onClick={() => (rowIsFilterable ? handleStudyPlanChange(studyRight.studyPlanId ?? null) : null)}
                  style={{
                    cursor: rowIsFilterable ? 'pointer' : 'not-allowed',
                    borderWidth: `0 1px ${isLastRow ? '1px' : '0'} 1px`, // Bottom border only for the last programme in the study right
                    backgroundColor: studyRight.studyPlanId === selectedStudyPlanId ? blue[50] : 'inherit',
                  }}
                >
                  {isFirstRow ? (
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
                            onClick={() => handleStudyPlanChange(studyRight.studyPlanId ?? null)}
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
                  ) : null}
                  <TableCell>
                    <Stack alignItems="center" direction="row">
                      {`${getTextIn(name)} (${reformatDate(startDate, DateFormat.DISPLAY_DATE)}–${reformatDate(endDate, DateFormat.DISPLAY_DATE)})`}
                      {studyProgrammes != null && code in studyProgrammes && (
                        <IconButton
                          color="primary"
                          component={Link}
                          size="small"
                          to={showPopulationStatistics(code, startDate.toString())}
                        >
                          <NorthEastIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{getTextIn(studyTrack?.name)}</TableCell>
                  {isFirstRow ? (
                    <TableCell rowSpan={numberOfProgrammes}>
                      <RenderStatus studyRight={studyRight} />
                    </TableCell>
                  ) : null}
                  {isFirstRow ? (
                    <TableCell rowSpan={numberOfProgrammes}>{renderCompletionPercent(studyRight, student)}</TableCell>
                  ) : null}
                </TableRow>
              )
            })
          })}
        </TableBody>
      </StyledTable>
    </Section>
  )
}
