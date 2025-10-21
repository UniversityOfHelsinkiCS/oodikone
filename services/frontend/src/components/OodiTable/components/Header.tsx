import { styled, SxProps, Theme } from '@mui/material/styles'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import type { HeaderGroup } from '@tanstack/react-table'

import { getCommonPinningStyles, verticalStyles } from '../styles'
import { OodiTableSortIcons } from './SortIcons'
import { flexRender } from './util'

const OtHeaderCell = styled(TableCell)(({ theme }) => ({
  position: 'relative',
  padding: '1.5em',
  borderWidth: '0 1px 1px 0',
  borderStyle: 'solid',
  borderColor: theme.palette.grey[300],
  fontWeight: 'bold',
  backgroundColor: theme.palette.common.white,
}))

const OtVerticalContentWrapper = styled('div')({
  writingMode: 'vertical-rl',
  textOrientation: 'mixed',
  whiteSpace: 'normal',
  overflow: 'visible',
  height: '100%',
  maxWidth: '15em',
  minHeight: '160px',
  maxHeight: '240px',
  margin: '0 auto',
})

export const OodiTableHeaderGroup = <OTData,>(headerGroup: HeaderGroup<OTData>, verticalHeaders: string[]) => (
  <TableRow key={headerGroup.id}>
    {headerGroup.headers.map(header => {
      if (header.depth - header.column.depth > 1) return null

      let rowSpan = 1
      if (header.isPlaceholder) {
        const leafs = header.getLeafHeaders()
        rowSpan = leafs[leafs.length - 1].depth - header.depth
      }

      const isVertical = verticalHeaders.includes(header.id)
      const canSort = header.column.getCanSort()

      const sx = {
        cursor: canSort ? 'pointer' : 'inherit',
        ...(isVertical && verticalStyles),
        ...getCommonPinningStyles(header.column),
      }

      return (
        <OtHeaderCell
          colSpan={header.colSpan}
          key={header.id}
          onClick={header.column.getToggleSortingHandler()}
          rowSpan={rowSpan}
          sx={sx as SxProps<Theme>}
        >
          {isVertical ? (
            <OtVerticalContentWrapper>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </OtVerticalContentWrapper>
          ) : (
            <>{flexRender(header.column.columnDef.header, header.getContext())}</>
          )}
          <OodiTableSortIcons canSort={canSort} isSorted={header.column.getIsSorted()} />
        </OtHeaderCell>
      )
    })}
  </TableRow>
)
