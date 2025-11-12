import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TableCell from '@mui/material/TableCell'

import { PopulationLink } from '@/components/common/PopulationLink'

export const YearCell = ({
  calendarYears,
  combinedProgramme,
  populationLinkVisible,
  setShow,
  show,
  degreeProgramme,
  year,
  yearlyData,
}: {
  calendarYears: number[]
  combinedProgramme: string
  populationLinkVisible: boolean
  setShow: () => void
  show: boolean
  degreeProgramme: string
  year: string
  yearlyData: (string | number)[][]
}) => {
  const populationYears = year !== 'Total' ? [parseInt(year.slice(0, 4), 10)] : calendarYears

  return (
    <TableCell sx={{ whiteSpace: 'nowrap' }}>
      <Stack alignItems="center" direction="row">
        {yearlyData.length > 1 && (
          <IconButton data-cy="show-study-tracks-button" onClick={setShow} size="small">
            {show ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        )}
        {year}
        {populationLinkVisible ? (
          <PopulationLink
            combinedProgramme={combinedProgramme}
            cypress={year.split(' - ')[0]}
            programme={degreeProgramme}
            years={populationYears}
          />
        ) : null}
      </Stack>
    </TableCell>
  )
}
