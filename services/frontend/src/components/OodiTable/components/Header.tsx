import type { FC, ReactNode } from 'react'

import TableCell, { type TableCellProps } from '@mui/material/TableCell'

export const OodiTableHeader: FC<TableCellProps & { children?: ReactNode }> = ({
  children,
  ...props
}) => {
  return (
    <TableCell {...props}
      sx={{
        ...props.sx,
        borderWidth: '0 1px 1px 0',
        borderStyle: 'solid',
        borderColor: 'grey.300',
        fontWeight: 'bold',
        backgroundColor: 'white',
      }}>
      {children}
    </TableCell>
  )

}

