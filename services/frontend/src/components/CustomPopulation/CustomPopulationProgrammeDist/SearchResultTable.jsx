import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { StyledTable } from '@/components/material/StyledTable'

export const SearchResultTable = ({ actionTrigger, headers, rows, noResultText, selectable }) => {
  if (!rows.length) return <div>{noResultText}</div>

  return (
    <StyledTable showCellBorders>
      <TableHead>
        <TableRow>
          {headers.map(header => (
            <TableCell key={`header-${header}`}>{header}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => (
          <TableRow
            className={selectable ? 'selectableRow' : ''}
            key={`row-${row[1]}`} // code
          >
            {Object.values(row).map((value, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <TableCell key={`row-${row[1]}-cell-${index}`}>
                {!!actionTrigger && index === 0 && actionTrigger(row)}
                {value}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </StyledTable>
  )
}
