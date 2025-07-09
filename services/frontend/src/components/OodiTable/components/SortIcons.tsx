import Box from "@mui/material/Box";

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import type { SortDirection } from "@tanstack/react-table";

export const OodiTableSortIcons = ({
  canSort,
  isSorted,
}: {
  canSort: boolean,
  isSorted: SortDirection | false
}) => (
  <Box
    sx={{
      position: 'absolute',
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      height: 'fit-content',
      width: 'fit-content',

      '& > svg': {
        width: '1em',
        height: '1em',
      }
    }}
  >
    {canSort && {
      asc: <ArrowUpwardIcon fontSize='small' sx={{ color: theme => theme.palette.primary.main }} />,
      desc: <ArrowDownwardIcon fontSize='small' sx={{ color: theme => theme.palette.primary.main }} />,
      false: <SwapVertIcon fontSize='small' sx={{ color: 'grey.300' }} />
    }[isSorted as string] || null}
  </Box>
)
