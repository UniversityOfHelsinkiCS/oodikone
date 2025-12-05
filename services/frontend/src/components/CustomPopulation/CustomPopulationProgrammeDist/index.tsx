import TableBody from '@mui/material/TableBody'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { getNewestProgrammeOfStudentAt } from '@/common'
import { FilterToggleIcon } from '@/components/common/FilterToggleIcon'
import { PercentageBar } from '@/components/common/PercentageBar'
import { StyledCell } from '@/components/common/StyledCell'
import { StyledTable } from '@/components/common/StyledTable'
import { isProgrammeSelected, toggleProgrammeSelection } from '@/components/FilterView/filters/programmes'
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetSemestersQuery } from '@/redux/semesters'
import { FormattedStudent, Name } from '@oodikone/shared/types'
import { findCorrectProgramme, NO_PROGRAMME } from './util'

export const CustomPopulationProgrammeDist = ({
  students,
  coursecodes,
  from,
  to,
}: {
  students: FormattedStudent[]
  coursecodes?: string[]
  from?: string
  to?: string
}) => {
  const { getTextIn } = useLanguage()
  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters, currentSemester } = semesters ?? { semesters: {}, currentSemester: null }
  if (!allSemesters || !currentSemester) return null

  const allProgrammes: Record<string, { name: Name; programmeStudents: number }> = {}
  for (const student of students) {
    let programme: { code: string; name: Name } | null
    if (coursecodes) {
      // If coursecodes is provided, from/to need to be as well
      programme = findCorrectProgramme(
        student,
        coursecodes,
        allSemesters,
        new Date(from!),
        new Date(to!),
        currentSemester.semestercode
      )
    } else {
      programme = getNewestProgrammeOfStudentAt(student.studyRights, currentSemester.semestercode, true)
    }

    programme ??= NO_PROGRAMME

    allProgrammes[programme.code] ??= { name: programme.name, programmeStudents: 0 }
    allProgrammes[programme.code].programmeStudents += 1
  }

  const tableRows = Object.entries(allProgrammes)
    .map(([code, { name, programmeStudents }]) => ({
      label: getTextIn(name),
      code,
      programmeStudents,
      percentageBar: <PercentageBar denominator={students.length} key={code} numerator={programmeStudents} />,
    }))
    .sort((a, b) => b.programmeStudents - a.programmeStudents)

  return (
    <StyledTable showCellBorders>
      <TableHead>
        <TableRow>
          <StyledCell width={1} />
          <StyledCell bold>Programme</StyledCell>
          <StyledCell bold>Code</StyledCell>
          <StyledCell>
            <Typography fontWeight="bold">Students</Typography>
            <Typography fontWeight="lighter">{`n=${students.length}`}</Typography>
          </StyledCell>
          <StyledCell bold>Percentage of population</StyledCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tableRows.map(row => (
          <TableRow key={`row-${row.code}`}>
            <StyledCell>
              <ProgrammeFilterToggleCell code={row.code} name={row.label ?? ''} />
            </StyledCell>
            <StyledCell text>{row.label}</StyledCell>
            <StyledCell text>{row.code}</StyledCell>
            <StyledCell text>{row.programmeStudents}</StyledCell>
            <StyledCell>{row.percentageBar}</StyledCell>
          </TableRow>
        ))}
      </TableBody>
    </StyledTable>
  )
}

const ProgrammeFilterToggleCell = ({ code, name }: { code: string; name: string }) => {
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(isProgrammeSelected(code))
  const title = (
    <span>
      {isActive ? 'Poista rajaus' : 'Rajaa opiskelijat'} koulutusohjelman {name} perusteella
    </span>
  )

  return (
    <Tooltip title={title}>
      <FilterToggleIcon isActive={isActive} onClick={() => filterDispatch(toggleProgrammeSelection(code))} />
    </Tooltip>
  )
}
