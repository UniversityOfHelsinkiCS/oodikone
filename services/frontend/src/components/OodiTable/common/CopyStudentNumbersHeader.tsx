import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import { Table } from '@tanstack/react-table'

import { handleClipboardCopy } from '@/components/OodiTable/utils'
import { useStatusNotification } from '@/components/StatusNotification/Context'
import { ContentCopyIcon } from '@/theme'

/** To be paired with Class stats student tables */
export const CopyStudentNumbersHeader = <TData,>({
  table,
  getStudentNumber,
  label = 'Student number',
}: {
  table: Table<TData>
  getStudentNumber: (row: TData) => string | null | undefined
  label?: string
}) => {
  const { setStatusNotification, closeNotification } = useStatusNotification()

  const allStudentNumbers = table
    .getFilteredRowModel()
    .rows.map(row => getStudentNumber(row.original))
    .filter((studentNumber): studentNumber is string => !!studentNumber)
  const copyText = `Copied ${allStudentNumbers.length} student numbers`

  return (
    <Stack direction="row" spacing={1} sx={{ verticalAlign: 'middle' }}>
      <Box sx={{ alignSelf: 'center' }}>{label}</Box>
      <Tooltip title="Copy all student numbers to clipboard">
        <IconButton
          onClick={event =>
            void handleClipboardCopy(event, allStudentNumbers, copyText, setStatusNotification, closeNotification)
          }
        >
          <ContentCopyIcon color="action" />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
