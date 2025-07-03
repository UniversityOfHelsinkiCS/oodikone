import type { FC, ReactNode } from 'react'

import TableCell, { type TableCellProps } from '@mui/material/TableCell'

const OodiTableHeader: FC<TableCellProps & { children?: ReactNode }> = ({
  children,
  ...props
}) => {
  return (
    <TableCell {...props} sx={{ background: "white", border: '1px solid rgba(34,36,38,.1)', fontWeight: 'bold' }}>
      {children}
    </TableCell>
  )

}

export default OodiTableHeader
