import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { createColumnHelper, getFilteredRowModel } from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'

import { Link } from '@/components/common/Link'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { LoadingSkeleton } from '@/components/Section/LoadingSkeleton'
import { MockButton } from '@/components/Users/MockButton'
import { RoleChip } from '@/components/Users/RoleChip'
import { DateFormat } from '@/constants/date'
import { useDebouncedState } from '@/hooks/debouncedState'
import { useGetProgrammesQuery } from '@/redux/populations'
import { SearchIcon, theme } from '@/theme'
import { User } from '@/types/api/users'
import { reformatDate } from '@/util/timeAndDate'
import { DetailedProgrammeRights } from '@oodikone/shared/types'

const FilterComponent = ({ setFilter }: { setFilter: (value: string) => void }) => {
  const [textField, setTextField] = useState('')

  return (
    <TextField
      label="Search by name or username"
      onChange={event => {
        setTextField(event.target.value)
        setFilter(event.target.value)
      }}
      size="small"
      slotProps={{
        input: { endAdornment: <SearchIcon fontSize="small" htmlColor={theme.palette.grey[700]} sx={{ ml: 2 }} /> },
      }}
      value={textField}
    />
  )
}

const columnHelper = createColumnHelper<User>()

export const UsersTable = ({ isLoading, users }: { isLoading: boolean; users: User[] | undefined }) => {
  'use memo'
  const { getTextIn } = useLanguage()
  const { data } = useGetProgrammesQuery()
  const studyProgrammes = useMemo(() => data?.filteredProgrammes ?? {}, [data])

  const formatProgrammeRights = useCallback(
    (programmeRights: DetailedProgrammeRights[]) => {
      const uniqueRights = new Set(programmeRights.map(programmeRight => programmeRight.code))
      const programmeNames: string[] = []
      uniqueRights.forEach(right => {
        const studyProgramme = studyProgrammes[right]
        if (studyProgramme) {
          programmeNames.push(getTextIn(studyProgramme.name)!)
        }
      })
      if (programmeNames.length === 0) {
        return ''
      }
      if (programmeNames.length === 1) {
        return programmeNames[0]
      }
      return `${programmeNames[0]} + ${programmeNames.length - 1} ${programmeNames.length === 2 ? 'other' : 'others'}`
    },
    [getTextIn, studyProgrammes]
  )

  const ooditableColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: cell => cell.getValue(),
      }),
      columnHelper.accessor('username', {
        header: 'Username',
        cell: cell => (
          <Link data-cy={`user-page-button-${cell.row.original.username}`} to={`/users/${cell.row.original.id}`}>
            {cell.getValue()}
          </Link>
        ),
        filterFn: (row, _, filterValue) => {
          const search = String(filterValue).toLowerCase()
          const { name, username } = row.original
          return name.toLowerCase().includes(search) || username.toLowerCase().includes(search)
        },
      }),
      columnHelper.accessor('roles', {
        header: 'Roles',
        cell: cell => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
            {cell
              .getValue()
              .toSorted((a, b) => a.localeCompare(b))
              .map(role => (
                <RoleChip key={role} role={role} />
              ))}
          </Box>
        ),
        enableSorting: false,
        size: 350,
      }),
      columnHelper.accessor('programmeRights', {
        header: 'Programmes',
        cell: cell => formatProgrammeRights(cell.getValue()),
        enableSorting: false,
      }),
      columnHelper.accessor('iamGroups', {
        header: 'IAM groups',
        cell: cell => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
            {cell
              .getValue()
              .toSorted((a, b) => a.localeCompare(b))
              .map(iamGroup => (
                <Chip key={iamGroup} label={iamGroup} size="small" />
              ))}
          </Box>
        ),
        enableSorting: false,
        size: 350,
      }),
      columnHelper.accessor('lastLogin', {
        header: 'Last login',
        cell: cell => reformatDate(cell.getValue(), DateFormat.DISPLAY_DATE),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: cell => (
          <Stack direction="row" gap={1}>
            <MockButton username={cell.row.original.username} />
          </Stack>
        ),
        enableSorting: false,
      }),
    ],
    [formatProgrammeRights]
  )

  const [filter, setFilter] = useDebouncedState('', 250)

  const ooditable = {
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters: [{ id: 'username', value: filter }],
    },
  }

  if (isLoading || !users) return <LoadingSkeleton />

  return (
    <OodiTable
      columns={ooditableColumns}
      data={users}
      options={ooditable}
      toolbarContent={<FilterComponent setFilter={setFilter} />}
    />
  )
}
