import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material'
import { Box, IconButton, TableCell, TableRow, Typography } from '@mui/material'

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
        <TableCell align={index === 0 ? 'center' : 'right'} key={getKey(value, index)}>
          {index === 0 ? (
            <Box alignItems="center" display="flex" justifyContent="center">
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
