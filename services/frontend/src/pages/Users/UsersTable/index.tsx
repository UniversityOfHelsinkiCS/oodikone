import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'

import TextField from '@mui/material/TextField'
import { createColumnHelper, getFilteredRowModel } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Link } from '@/components/common/Link'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { MockButton } from '@/components/Users/MockButton'
import { RoleChip } from '@/components/Users/RoleChip'
import { DateFormat } from '@/constants/date'
import { useDebouncedState } from '@/hooks/debouncedState'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetRolesQuery } from '@/redux/users'
import { SearchIcon, theme } from '@/theme'
import { User } from '@/types/api/users'
import { reformatDate } from '@/util/timeAndDate'
import { DetailedProgrammeRights, Role } from '@oodikone/shared/types'

const FilterComponent = ({ setFilter }) => {
  const [textField, setTextField] = useState('')
  useEffect(() => {
    setFilter(textField)
  }, [textField])

  return (
    <TextField
      label="Filter by name or username"
      onChange={event => setTextField(event.target.value)}
      size="small"
      slotProps={{ input: { endAdornment: <SearchIcon fontSize="small" htmlColor={theme.palette.grey[700]} /> } }}
      sx={{ width: '320px' }}
      value={textField}
    />
  )
}

const columnHelper = createColumnHelper<User>()

export const UsersTable = ({
  getAllUsersQuery,
  users,
}: {
  getAllUsersQuery: any // TODO: What is the type?
  users: User[]
}) => {
  const { getTextIn } = useLanguage()
  const { data: roles = [] } = useGetRolesQuery()
  const { data } = useGetProgrammesQuery()
  const studyProgrammes = data?.filteredProgrammes ?? {}

  const iamGroups = [...new Set(users?.flatMap(user => user.iamGroups))]

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
        cell: cell => cell.getValue<string>(),
      }),
      columnHelper.accessor('username', {
        header: 'Username',
        cell: cell => (
          <Link data-cy={`user-page-button-${cell.row.original.username}`} to={`/users/${cell.row.original.id}`}>
            {cell.getValue<string>()}
          </Link>
        ),
        filterFn: (row, _, filterValue) => {
          const { name, username } = row.original
          return name.toLowerCase().includes(filterValue) || username.toLocaleLowerCase().includes(filterValue)
        },
      }),
      columnHelper.accessor('roles', {
        header: 'Roles',
        cell: cell => (
          <Box display="flex" flexWrap="wrap" gap={1}>
            {cell
              .getValue<Role[]>()
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
        cell: cell => formatProgrammeRights(cell.getValue<DetailedProgrammeRights[]>()),
        enableSorting: false,
      }),
      columnHelper.accessor('iamGroups', {
        header: 'IAM groups',
        cell: cell => (
          <Box display="flex" flexWrap="wrap" gap={1}>
            {cell
              .getValue<string[]>()
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
        cell: cell => reformatDate(cell.getValue<string>(), DateFormat.DISPLAY_DATE),
        enableColumnFilter: false,
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
    [formatProgrammeRights, getAllUsersQuery, iamGroups, roles]
  )

  const [filter, setFilter] = useDebouncedState('', 250)

  const ooditable = {
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters: [{ id: 'username', value: filter }],
    },
  }

  return (
    <OodiTable
      columns={ooditableColumns}
      data={users}
      options={ooditable}
      toolbarContent={<FilterComponent setFilter={setFilter} />}
    />
  )
}
