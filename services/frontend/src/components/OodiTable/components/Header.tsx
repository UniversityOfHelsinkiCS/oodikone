import type { FC, ReactNode } from 'react'

import TableCell, { type TableCellProps } from '@mui/material/TableCell'

export const OodiTableHeader: FC<TableCellProps & { children?: ReactNode }> = ({
  children,
  ...props
}) => {
  return (
    <TableCell {...props} sx={{ border: '1px solid #e9e9e9', fontWeight: 'bold' }}>
      {children}
    </TableCell>
  )

}

