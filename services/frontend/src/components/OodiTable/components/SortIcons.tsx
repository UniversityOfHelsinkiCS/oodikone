import styled from '@mui/material/styles/styled'
import type { SortDirection } from '@tanstack/react-table'

import { ArrowDownwardIcon, ArrowUpwardIcon, SwapVertIcon } from '@/theme'

export const OtSortIconWrapper = styled('div')(() => ({
  position: 'absolute',
  right: '0',
  bottom: '0',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
  height: 'fit-content',
  width: 'fit-content',
}))

const OtSortAscIcon = styled(ArrowUpwardIcon)(({ theme }) => ({
  fontSize: '1.25em',
  color: theme.palette.primary.main,
}))

const OtSortDescIcon = styled(ArrowDownwardIcon)(({ theme }) => ({
  fontSize: '1.25em',
  color: theme.palette.primary.main,
}))

const OtSortUnsetIcon = styled(SwapVertIcon)(({ theme }) => ({
  fontSize: '1.25em',
  color: theme.palette.grey[300],
}))

export const OodiTableSortIcons = ({ canSort, isSorted }: { canSort: boolean; isSorted: SortDirection | false }) => {
  if (!canSort) return null

  switch (isSorted) {
    case 'asc':
      return <OtSortAscIcon />
    case 'desc':
      return <OtSortDescIcon />
    case false:
      return <OtSortUnsetIcon />
    default:
      return null
  }
}
