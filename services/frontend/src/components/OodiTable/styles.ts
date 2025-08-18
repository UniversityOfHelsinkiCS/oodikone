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

export const getVerticalStyles = (): SxProps<Theme> => ({
  overflow: 'visible',
  borderWidth: '1px 1px 1px 0',
  borderStyle: 'solid',
  borderColor: 'grey.300',
  padding: '0.1em',
})
