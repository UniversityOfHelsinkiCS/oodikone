import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { KeyboardArrowRightIcon, KeyboardArrowDownIcon } from '@/theme'

const roundValue = (value: number | string | undefined) => {
  return typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value
}

const getKey = (value: number | string, index: number) => `${value}-${index}`

export const ExpandableRow = ({
  cypress,
  toggleVisibility,
  visible,
  yearArray,
  yearIndex,
}: {
  cypress: string
  toggleVisibility: () => void
  visible: boolean
  yearArray: (number | string)[]
  yearIndex: number
}) => {
  return (
    <TableRow>
      {yearArray?.map((value, index) => (
        <TableCell align="right" key={getKey(value, index)}>
          {index === 0 ? (
            <Box alignItems="center" display="flex" justifyContent="left">
              <IconButton data-cy={`${cypress}${yearIndex}`} onClick={toggleVisibility} size="small">
                {visible ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              </IconButton>
              <Typography variant="body2">{value}</Typography>
            </Box>
          ) : (
            roundValue(value)
          )}
        </TableCell>
      ))}
    </TableRow>
  )
}
