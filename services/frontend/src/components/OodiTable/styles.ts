import type { Column } from '@tanstack/react-table'
import type { SxProps } from '@mui/material'


export const getCommonPinningStyles = <TData,>(column: Column<TData>): SxProps => {
  const isPinned = column.getIsPinned()
  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),

    /*
    * zIndices:
    * 0, base
    * 1, sticky cells
    * 2, header tablerow
    */
    zIndex: isPinned ? 1 : 0,
  }
}
