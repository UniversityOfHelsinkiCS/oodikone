import { TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'

import { StyledTable } from '@/components/material/StyledTable'

const getRowKey = (row: number) => `row-${row}`

const getCellKey = (row: number, cell: number) => `row-${row}-cell-${cell}`

export const DataTable = ({
  cypress,
  data,
  titles,
}: {
  cypress: string
  data: (number | string)[][]
  titles: (number | string)[]
}) => {
  if (!data || !titles) {
    return null
  }

  const textAlign = (value: string | number, index: number) => {
    if (index === 0) {
      return 'center'
    }
    if (Number.isInteger(value)) {
      return 'right'
    }
    return 'left'
  }

  return (
    <TableContainer component={Paper}>
      <StyledTable data-cy={`${cypress}-data-table`} showCellBorders>
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
            <TableRow key={getRowKey(rowIndex)}>
              {yearArray?.map((value, cellIndex) => (
                <TableCell align={textAlign(value, cellIndex)} key={getCellKey(rowIndex, cellIndex)}>
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
