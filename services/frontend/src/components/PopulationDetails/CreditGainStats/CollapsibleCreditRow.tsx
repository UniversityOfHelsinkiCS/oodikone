import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Box from '@mui/material/Box'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { Fragment, useState } from 'react'

import { PercentageBar } from '@/components/material/PercentageBar'
import { ExternalCreditFilterToggle } from './ExternalCreditFilterToggle'

type CollapsibleCreditRowProps = {
  min: number | null
  max: number | null
  getStudentsInCreditCategory: (min: number, max: number) => string[]
  filteredLength: number
  months: number
  monthsFromStart: number
  studyPlanFilterIsActive: boolean
}

export const CollapsibleCreditRow = ({
  min,
  max,
  getStudentsInCreditCategory,
  filteredLength,
  months,
  monthsFromStart,
  studyPlanFilterIsActive,
}: CollapsibleCreditRowProps) => {
  const [limits, setLimits] = useState<[number, number][]>([])

  const toggleExpanded = () => {
    if (limits.length) {
      setLimits([])
      return
    }
    const factor = months * (5 / 12)
    const newLimits = [0, 1, 2].reduce<typeof limits>((acc, n) => {
      const min = Math.ceil(max! - n * factor - factor)
      acc.push([min === 0 ? 1 : min, Math.ceil(max! - n * factor)])
      return acc
    }, [])

    setLimits(newLimits)
  }

  const isExpanded = limits.length > 0
  const isExpandable = typeof min === 'number' && typeof max === 'number'

  const getCellText = (min: number | null, max: number | null) =>
    max === 0 ? '0 credits' : `${min} ≤ credits${max && max > 0 ? ` < ${max}` : ''}`

  const categoryStudents = getStudentsInCreditCategory(min ?? 0, max ?? Infinity)

  const filterHelpText = studyPlanFilterIsActive
    ? 'Rajaa opiskelijat HOPSiin sijoitettujen suoritusten perusteella'
    : `Rajaa opiskelijat ensimmäisen ${monthsFromStart} kuukauden aikana saatujen opintopisteiden perusteella`

  return (
    <Fragment>
      <TableRow
        onClick={isExpandable ? toggleExpanded : undefined}
        sx={{ cursor: isExpandable ? 'pointer' : 'initial' }}
      >
        <TableCell>
          <Box onClick={event => event.stopPropagation()} sx={{ cursor: 'initial' }}>
            <ExternalCreditFilterToggle helpText={filterHelpText} students={categoryStudents} />
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex' }}>
            <Typography>{getCellText(min, max)}</Typography>
            {isExpandable && (isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
          </Box>
        </TableCell>
        <TableCell>{!isExpanded && <Typography>{categoryStudents.length}</Typography>}</TableCell>
        <TableCell>
          {filteredLength && !isExpanded && (
            <PercentageBar denominator={filteredLength} numerator={categoryStudents.length} />
          )}
        </TableCell>
      </TableRow>
      {limits.map(([imin, imax]) => {
        const categoryStudents = getStudentsInCreditCategory(imin, imax)
        return (
          <TableRow key={`table-row-${imin}-${imax}`} sx={{ backgroundColor: 'grey.300' }}>
            <TableCell>
              <ExternalCreditFilterToggle helpText={filterHelpText} students={categoryStudents} />
            </TableCell>
            <TableCell>
              <Typography>{getCellText(imin, imax)}</Typography>
            </TableCell>
            <TableCell>
              <Typography>{categoryStudents.length}</Typography>
            </TableCell>
            <TableCell>
              {filteredLength && <PercentageBar denominator={filteredLength} numerator={categoryStudents.length} />}
            </TableCell>
          </TableRow>
        )
      })}
    </Fragment>
  )
}
