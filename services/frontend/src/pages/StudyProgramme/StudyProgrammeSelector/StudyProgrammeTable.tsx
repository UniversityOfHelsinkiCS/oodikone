import PushPinIcon from '@mui/icons-material/PushPin'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useMemo } from 'react'
import { Link } from 'react-router'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { useAddStudyProgrammePinMutation, useRemoveStudyProgrammePinMutation } from '@/redux/studyProgrammePins'
import { CombinedDegreeProgramme, DegreeProgramme } from '@/types/api/faculty'

export const StudyProgrammeTable = ({
  header,
  pinnedProgrammes,
  programmes,
  visible = true,
}: {
  header: string
  pinnedProgrammes: string[]
  programmes: (DegreeProgramme | CombinedDegreeProgramme)[]
  visible?: boolean
}) => {
  const { getTextIn } = useLanguage()

  const [addStudyProgrammePins] = useAddStudyProgrammePinMutation()
  const [removeStudyProgrammePins] = useRemoveStudyProgrammePinMutation()

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        size: 160,
      },
      {
        accessorKey: 'progId',
        header: 'Id',
        size: 100,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        Cell: ({ row }) => <Link to={`/study-programme/${row.original.code}`}>{getTextIn(row.original.name)}</Link>,
        minSize: 490,
      },
      {
        id: 'pin',
        header: 'Pin',
        Header: (
          <TableHeaderWithTooltip
            header="Pin"
            tooltipText={`
              Click the pin icon to pin/unpin a programme.
              Pinned programmes are shown first here and in the degree programme search in Class statistics.
            `}
          />
        ),
        Cell: ({ row }) => {
          const isPinned = pinnedProgrammes.includes(row.original.code)
          return (
            <IconButton
              data-cy={`pin-programme-${row.original.code}-button`}
              onClick={
                isPinned
                  ? () => void removeStudyProgrammePins({ programmeCode: row.original.code })
                  : () => void addStudyProgrammePins({ programmeCode: row.original.code })
              }
              sx={{
                color: theme =>
                  isPinned ? theme.palette.studyProgrammePin.pinned : theme.palette.studyProgrammePin.unpinned,
              }}
            >
              <PushPinIcon fontSize="small" />
            </IconButton>
          )
        },
        size: 100,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
      },
    ],
    [addStudyProgrammePins, getTextIn, pinnedProgrammes, removeStudyProgrammePins]
  )

  const table = useMaterialReactTable({
    columns,
    data: programmes,
    enableBottomToolbar: false,
    enableColumnActions: false,
    enablePagination: false,
    enableSorting: false,
    enableTopToolbar: false,
    layoutMode: 'grid',
    initialState: {
      density: 'compact',
    },
  })

  if (!visible || programmes == null || programmes.length === 0) {
    return null
  }

  return (
    <Stack direction="column" gap={1}>
      <Typography component="h3" variant="h6">
        {header}
      </Typography>
      <MaterialReactTable table={table} />
    </Stack>
  )
}
