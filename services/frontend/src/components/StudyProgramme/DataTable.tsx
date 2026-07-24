/* oxlint-disable react/no-array-index-key */
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { StyledTable } from '@/components/common/StyledTable'

const textAlign = (value: string | number, index: number) => {
  if (index === 0) return 'center'
  if (Number.isInteger(value)) return 'right'
  return 'left'
}

export const DataTable = ({
  cypress,
  data,
  titles,
}: {
  cypress: string
  data: (number | string)[][]
  titles: (number | string)[]
}) => {
  'use memo'
  if (!data || !titles) {
    return null
  }

  return (
    <TableContainer>
      <StyledTable data-cy={`${cypress}-data-table`} nowrapBody slimHeader showCellBorders>
        <TableHead>
          <TableRow>
            {titles.map(title => (
              <TableCell align="center" key={title}>
                {title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((yearArray, rowIndex) => (
            <TableRow key={`row-${yearArray[0]}`}>
              {yearArray?.map((value, cellIndex) => (
                <TableCell align={textAlign(value, cellIndex)} key={`row-${data[rowIndex]}-cell-${cellIndex}`}>
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </TableContainer>
  )
}
