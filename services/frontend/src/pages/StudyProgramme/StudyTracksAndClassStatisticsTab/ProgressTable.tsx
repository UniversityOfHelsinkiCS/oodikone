import { Paper, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

import { StyledTable } from '@/components/material/StyledTable'
import { getCellKey, getRowKey } from './StudyTrackDataTable/util'

export const ProgressTable = ({ data, titles }: { data: (string | number)[][]; titles: string[] }) => {
  if (!data.length || !titles) {
    return null
  }

  const sortedData = data.toSorted((a, b) => {
    if (a[0] === 'Total') return 1
    if (b[0] === 'Total') return -1
    return parseInt(String(b[0]).split(' - ')[0], 10) - parseInt(String(a[0]).split(' - ')[0], 10)
  })

  return (
    <TableContainer component={Paper} variant="outlined">
      <StyledTable data-cy="study-programme-progress-table" showCellBorders size="small">
        <TableHead>
          <TableRow>
            {titles?.map((title, index) => (
              <TableCell align="center" key={getCellKey(title, index)}>
                {title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow key={getRowKey(row[0].toString(), index)}>
              {row.map((value, index) => (
                <TableCell align={index === 0 ? 'center' : 'right'} key={getCellKey(value.toString(), index)}>
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
