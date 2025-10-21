import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import styled from '@mui/material/styles/styled'
import type { SortDirection } from '@tanstack/react-table'

const OtSortIconWrapper = styled('div')(() => ({
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
  fontSize: '1.25rem',
  color: theme.palette.primary.main,
}))

const OtSortDescIcon = styled(ArrowDownwardIcon)(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.primary.main,
}))

const OtSortUnsetIcon = styled(SwapVertIcon)(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.grey[300],
}))

export const OodiTableSortIcons = ({ canSort, isSorted }: { canSort: boolean; isSorted: SortDirection | false }) => (
  <OtSortIconWrapper>
    {canSort
      ? {
          asc: <OtSortAscIcon />,
          desc: <OtSortDescIcon />,
          false: <OtSortUnsetIcon />,
        }[isSorted as string]
      : null}
  </OtSortIconWrapper>
)
