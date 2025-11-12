import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import LayersIcon from '@mui/icons-material/Layers'
import NorthEastIcon from '@mui/icons-material/NorthEast'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { getTextInWithOpen } from '@/common'
import { Link } from '@/components/common/Link'
import { StyledTable } from '@/components/common/StyledTable'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import { DateFormat } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'

const creditsColumnIndex = 3

// Some courses are without AY in the beginning in the studyplan even though the credits are registered with AY.
const isInStudyPlan = (plan, code: string) =>
  plan && (plan.included_courses.includes(code) ?? plan.included_courses.includes(code.replace('AY', '')))

const getAcademicYear = (date: string) => {
  const year = new Date(date).getFullYear()
  const month = new Date(date).getMonth()
  // Months are 0-indexed so 7 means August...
  return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`
}

const getIcon = (credittypecode: number, isStudyModuleCredit: boolean, passed: boolean) => {
  if (isStudyModuleCredit) return <LayersIcon color="secondary" fontSize="small" titleAccess="Study module" />
  if (credittypecode === 9) return <SwapHorizIcon color="success" fontSize="small" titleAccess="Credit transfer" />
  return passed ? <DoneIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />
}

export const CourseTables = ({ student, selectedStudyPlanId }) => {
  const { getTextIn } = useLanguage()
  if (!student) return null

  const studyPlan = student?.studyplans.find(plan => plan.id === selectedStudyPlanId)

  const groupedCourses: Record<string, React.ReactNode[][]> = {}

  for (let i = student.courses.length - 1; i >= 0; i--) {
    const attainment = student.courses[i]

    const { course, credits, credittypecode, date, grade, isOpenCourse, isStudyModuleCredit, passed } = attainment
    const isIncluded = isInStudyPlan(studyPlan, course.code)
    const academicYear = getAcademicYear(date)

    groupedCourses[academicYear] ??= []

    groupedCourses[academicYear].push([
      isIncluded,
      reformatDate(date, DateFormat.DISPLAY_DATE),
      <div
        key={`${course.code}-${new Date(date).getTime()}-course-${grade}`}
        style={{ display: 'flex', justifyContent: 'space-between' }}
      >
        {getTextInWithOpen(course, getTextIn, isOpenCourse, isStudyModuleCredit)}
        {credittypecode === 7 && (
          <div>
            <Chip
              label={getTextIn({ fi: 'TOISSIJAINEN', en: 'SECONDARY', sv: 'SEKUNDÄR' })}
              sx={theme => ({
                borderRadius: 1,
                color: theme.palette.text.secondary,
                fontSize: 12,
                fontWeight: 'bold',
                height: 17,
                '& .MuiChip-label': {
                  paddingX: 0.75,
                },
              })}
            />
          </div>
        )}
      </div>,
      <Stack direction="row" key={`${course.code}-${new Date(date).getTime()}-grade-${grade}`} spacing={1}>
        {getIcon(credittypecode, isStudyModuleCredit, passed)}
        <span>{grade}</span>
      </Stack>,
      credits,
      <IconButton
        color="primary"
        component={Link}
        key={`${course.code}-${new Date(date).getTime()}-link-${grade}`}
        size="small"
        sx={{ height: 20, width: 20 }}
        title={`View course statistics for ${getTextIn(course.name)} (${course.code})`}
        to={`/coursestatistics?courseCodes=["${course.code}"]&separate=false&combineSubstitutions=true`}
      >
        <NorthEastIcon fontSize="small" />
      </IconButton>,
    ])
  }

  return (
    <Section title="Courses">
      <Stack spacing={4}>
        {Object.entries(groupedCourses).map(([academicYear, courses]) => (
          <Stack key={academicYear} spacing={1}>
            <Typography variant="h6">{academicYear}</Typography>
            <StyledTable>
              <TableHead>
                <TableRow>
                  <TableCell width="150px">Date</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell width="100px">Grade</TableCell>
                  <TableCell align="right" width="100px">
                    Credits
                  </TableCell>
                  <TableCell width="50px"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map(([highlight, ...rest], index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <TableRow key={`row-${index}`} sx={{ backgroundColor: highlight ? '#e8f4ff' : 'inherit' }}>
                    {rest.map((value, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <TableCell align={index === creditsColumnIndex ? 'right' : 'left'} key={`cell-${index}`}>
                        {value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </StyledTable>
          </Stack>
        ))}
      </Stack>
    </Section>
  )
}
