
import type { FC, ReactNode } from 'react'

import TableCell, { type TableCellProps } from '@mui/material/TableCell'
import Box from '@mui/material/Box'

export const OodiTableCell: FC<TableCellProps & { children?: ReactNode }> = ({
  children,
  ...props
}) => {
  return (
    <TableCell {...props} sx={{
      borderWidth: '0 1px 1px 0',
      borderStyle: 'solid',
      borderColor: 'grey.300',
      paddingTop: 0,
      paddingBottom: 0,
      height: '3em',
      minHeight: '3em',
      ...props?.sx
    }}>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          maxWidth: '20em',
          whiteSpace: 'nowrap',
        }}>
        {children}
      </Box>
    </TableCell>
  )

}
