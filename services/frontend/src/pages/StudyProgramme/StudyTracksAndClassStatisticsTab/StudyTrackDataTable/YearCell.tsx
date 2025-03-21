import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material'
import { TableCell, IconButton, Stack } from '@mui/material'

import { PopulationLink } from '@/components/material/PopulationLink'

export const YearCell = ({
  calendarYears,
  combinedProgramme,
  populationLinkVisible,
  setShow,
  show,
  studyProgramme,
  year,
  yearlyData,
}: {
  calendarYears: number[]
  combinedProgramme: string
  populationLinkVisible: boolean
  setShow: () => void
  show: boolean
  studyProgramme: string
  year: string
  yearlyData: (string | number)[][]
}) => {
  return (
    <TableCell sx={{ whiteSpace: 'nowrap' }}>
      <Stack alignItems="center" direction="row">
        {yearlyData.length > 1 && (
          <IconButton data-cy="show-study-tracks-button" onClick={setShow} size="small">
            {show ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        )}
        {year}
        {populationLinkVisible && (
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
