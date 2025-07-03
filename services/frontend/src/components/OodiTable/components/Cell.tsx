
import type { FC, ReactNode } from 'react'

import TableCell, { type TableCellProps } from '@mui/material/TableCell'

export const OodiTableCell: FC<TableCellProps & { children?: ReactNode }> = ({
  children,
  ...props
}) => {
  return (
    <TableCell {...props} sx={{
      '& tr:nth-of-type(odd) > td': {
        backgroundColor: 'grey.100',
      },
      border: '1px solid #e9e9e9',
      paddingTop: 0,
      paddingBottom: 0,
    }}>
      {children}
    </TableCell>
  )

}
