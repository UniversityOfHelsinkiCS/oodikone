import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material'
import { TableCell, IconButton, Stack } from '@mui/material'

import { PopulationLink } from '@/components/material/PopulationLink'

export const YearCell = ({
  allRights,
  calendarYears,
  combinedProgramme,
  fullAccessToStudentData,
  setShow,
  show,
  studyProgramme,
  year,
  yearlyData,
}: {
  allRights: string[]
  calendarYears: number[]
  combinedProgramme: string
  fullAccessToStudentData: boolean
  setShow: () => void
  show: boolean
  studyProgramme: string
  year: string
  yearlyData: (string | number)[][]
}) => {
  return (
    <TableCell>
      <Stack alignItems="center" direction="row">
        {yearlyData.length > 1 && (
          <IconButton data-cy="show-study-tracks-button" onClick={setShow} size="small">
            {show ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        )}
        {year}
        {(fullAccessToStudentData || allRights.includes(studyProgramme) || allRights.includes(combinedProgramme)) && (
          <PopulationLink
            combinedProgramme={combinedProgramme}
            cypress={year.split(' - ')[0]}
            studyProgramme={studyProgramme}
            year={year}
            years={calendarYears}
          />
        )}
      </Stack>
    </TableCell>
  )
}
