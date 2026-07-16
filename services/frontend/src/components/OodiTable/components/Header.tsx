import { styled, SxProps, Theme } from '@mui/material/styles'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import type { Header, HeaderGroup, RowData } from '@tanstack/react-table'

import { useRef } from 'react'
import { OodiTableSortIcons, OtSortIconWrapper } from '@/components/OodiTable/components/SortIcons'
import { flexRender } from '@/components/OodiTable/components/util'
import { getCommonPinningStyles, verticalStyles } from '@/components/OodiTable/styles'

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

const OodiTableHeaderSinglton = <OTData extends RowData, OTValue = unknown>({
  header,
  isVerticalHeader,
}: {
  header: Header<OTData, OTValue>
  isVerticalHeader: boolean
}) => {
  const base = useRef(null)
  let rowSpan = 1
  if (header.isPlaceholder) {
    const leafs = header.getLeafHeaders()
    rowSpan = leafs[leafs.length - 1].depth - header.depth
  }

  const canSort = header.column.getCanSort()

  const sx = {
    cursor: canSort ? 'pointer' : 'inherit',
    ...(isVerticalHeader && verticalStyles),
    ...getCommonPinningStyles(header.column),
  }

  return (
    <OtHeaderCell
      colSpan={header.colSpan}
      key={header.id}
      onClick={header.column.getToggleSortingHandler()}
      ref={base}
      rowSpan={rowSpan}
      sx={sx as SxProps<Theme>}
    >
      {isVerticalHeader ? (
        <OtVerticalContentWrapper>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </OtVerticalContentWrapper>
      ) : (
        <>{flexRender(header.column.columnDef.header, header.getContext())}</>
      )}
      <OtSortIconWrapper>
        <OodiTableSortIcons canSort={canSort} isSorted={header.column.getIsSorted()} />
      </OtSortIconWrapper>
    </OtHeaderCell>
  )
}

export const OodiTableHeaderGroup = <OTData extends RowData>(
  headerGroup: HeaderGroup<OTData>,
  verticalHeaders: string[]
) => (
  <TableRow key={headerGroup.id}>
    {headerGroup.headers.map(header => {
      if (header.depth - header.column.depth > 1) return null
      else
        return (
          <OodiTableHeaderSinglton
            header={header}
            isVerticalHeader={verticalHeaders.includes(header.id)}
            key={header.id}
          />
        )
    })}
  </TableRow>
)
