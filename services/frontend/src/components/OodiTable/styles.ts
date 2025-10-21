import type { SxProps, Theme } from '@mui/material/styles'
import type { Column } from '@tanstack/react-table'

export const getCommonPinningStyles = <TData>(column: Column<TData>): SxProps<Theme> => {
  const isPinned = column.getIsPinned()
  return isPinned
    ? {
        position: 'sticky',
        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        width: column.getSize(),

        /*
         * zIndices:
         * 0, base
         * 1, sticky cells
         * 2, header tablerow
         */
        zIndex: 1,
      }
    : {}
}

export const verticalStyles: SxProps<Theme> = {
  overflow: 'visible',
  padding: '1em 0.5em',
}
