import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import dayjs, { type Dayjs } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { getStudentTotalCredits } from '@/common'
import { hopsFilter as studyPlanFilter, creditDateFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { DateFormat } from '@/constants/date'
import { formatDate } from '@/util/timeAndDate'
import { CollapsibleCreditRow } from './CollapsibleCreditRow'

dayjs.extend(isBetween)

type CreditsGainedTableProps = {
  filteredStudents: any[] // TODO: type
  programmeGoalTime: number
  type: string
  year: number
}

type CreditListStudent = {
  studentNumber: string
  credits: number
}

export const CreditsGainedTable = ({ filteredStudents, programmeGoalTime, type, year }: CreditsGainedTableProps) => {
  const { useFilterSelector } = useFilters()
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions())
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  let creditList: CreditListStudent[] = []

  const getStudentsInCreditCategory = (min: number, max = Infinity) =>
    max === 0
      ? creditList.filter(student => student.credits === 0).map(student => student.studentNumber)
      : creditList
          .filter(student => student.credits < max && student.credits >= min)
          .map(student => student.studentNumber)

  const getMonths = (start: Dayjs, end: Dayjs) => {
    const lastDayOfMonth = end.endOf('month')
    return Math.round(dayjs(lastDayOfMonth).diff(dayjs(start), 'months', true))
  }

  const { startDate, endDate } = creditDateFilterOptions
  const start = startDate ?? dayjs(`${year}-08-01`)
  const end = endDate ?? dayjs()

  const months = getMonths(start, end)

  const getTitle = () => {
    if (studyPlanFilterIsActive) {
      return 'All credits in studyplan'
    }

    const startFormatted = formatDate(start, DateFormat.DISPLAY_DATE)
    const endFormatted = formatDate(end, DateFormat.DISPLAY_DATE)
    return `Credits gained between ${startFormatted} and ${endFormatted}`
  }

  if (studyPlanFilterIsActive) {
    creditList = filteredStudents.map(({ studentNumber, hopsCredits: credits }) => ({ studentNumber, credits }))
  } else {
    creditList = filteredStudents.map(({ studentNumber, courses }) => ({
      studentNumber,
      credits: getStudentTotalCredits({
        courses: courses.filter(course => dayjs(course.date).isBetween(start, end)),
      }),
    }))
  }

  const monthsForLimits = programmeGoalTime ? Math.min(months, programmeGoalTime) : months

  const limits: [number | null, number | null][] = [
    [Math.ceil(monthsForLimits * (60 / 12)), null],
    [Math.ceil(monthsForLimits * (45 / 12)), Math.ceil(monthsForLimits * (60 / 12))],
    [Math.ceil(monthsForLimits * (30 / 12)), Math.ceil(monthsForLimits * (45 / 12))],
    [Math.ceil(monthsForLimits * (15 / 12)), Math.ceil(monthsForLimits * (30 / 12))],
    [1, Math.ceil(monthsForLimits * (15 / 12))],
    [null, 0],
  ]

  return (
    <Box
      data-cy={`credits-gained-table-${type}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 1,
      }}
    >
      <Typography component="span" sx={{ mt: '1em' }} variant="h5">
        {type}
      </Typography>
      <Table>
        <TableHead>
          <TableRow key={`credits-gained-table-${type}-MATERIALUI`}>
            <TableCell></TableCell>
            <TableCell>
              <Typography fontWeight="inherit">{getTitle()}</Typography>
              {!studyPlanFilterIsActive && (
                <Typography fontWeight="250">{`(${months} ${months === 1 ? 'month' : 'months'})`}</Typography>
              )}
            </TableCell>
            <TableCell>
              <Typography fontWeight="inherit">Number of students</Typography>
              <Typography fontWeight="250">(n = {filteredStudents.length})</Typography>
            </TableCell>
            <TableCell>
              <Typography fontWeight="inherit">Percentage of population</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody data-cy="credits-gained-table-body">
          {limits.map(([min, max]) => (
            <CollapsibleCreditRow
              filteredLength={filteredStudents.length}
              getStudentsInCreditCategory={getStudentsInCreditCategory}
              key={`credits-table-row-${min}-${max}-${type}`}
              max={max}
              min={min}
              months={monthsForLimits}
              monthsFromStart={months}
              studyPlanFilterIsActive={studyPlanFilterIsActive}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
