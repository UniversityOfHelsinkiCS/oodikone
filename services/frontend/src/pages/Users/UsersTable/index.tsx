import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'

import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useCallback, useMemo } from 'react'

import { isDefaultServiceProvider } from '@/common'
import { Link } from '@/components/common/Link'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { MockButton } from '@/components/Users/MockButton'
import { RoleChip } from '@/components/Users/RoleChip'
import { DateFormat } from '@/constants/date'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetRolesQuery } from '@/redux/users'
import { User } from '@/types/api/users'
import { reformatDate } from '@/util/timeAndDate'
import { DetailedProgrammeRights, Role } from '@oodikone/shared/types'
import { CopyEmailAddressesButton } from './CopyEmailAddressesButton'
import { DeleteButton } from './DeleteButton'
import { StatusMessage } from './StatusMessage'

export const UsersTable = ({
  getAllUsersQuery,
  isError,
  isLoading,
  users,
}: {
  getAllUsersQuery: any // TODO: What is the type?
  isError: boolean
  isLoading: boolean
  users: User[]
}) => {
  const { getTextIn } = useLanguage()
  const { data: roles = [] } = useGetRolesQuery()
  const { data: studyProgrammes = {} } = useGetProgrammesQuery()

  const iamGroups = [...new Set(users.map(user => user.iamGroups).flat())]

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

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        Cell: ({ cell }) => cell.getValue<string>(),
      },
      {
        accessorKey: 'username',
        header: 'Username',
        Cell: ({ cell, row }) => (
          <Link data-cy={`user-page-button-${row.original.username}`} to={`/users/${row.original.id}`}>
            {cell.getValue<string>()}
          </Link>
        ),
      },
      {
        accessorKey: 'roles',
        header: 'Roles',
        Cell: ({ cell }) => (
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
        filterVariant: 'multi-select',
        filterSelectOptions: roles,
      },
      {
        accessorKey: 'programmeRights',
        header: 'Programmes',
        Cell: ({ cell }) => formatProgrammeRights(cell.getValue<DetailedProgrammeRights[]>()),
        enableSorting: false,
      },
      {
        accessorKey: 'iamGroups',
        header: 'IAM groups',
        Cell: ({ cell }) => (
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
        filterVariant: 'multi-select',
        filterSelectOptions: iamGroups,
      },
      {
        accessorKey: 'lastLogin',
        header: 'Last login',
        Cell: ({ cell }) => reformatDate(cell.getValue<string>(), DateFormat.DISPLAY_DATE),
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        Cell: ({ row }) => (
          <Stack direction="row" gap={1}>
            <MockButton username={row.original.username} />
            {!isDefaultServiceProvider() && (
              <DeleteButton getAllUsersQuery={getAllUsersQuery} userId={row.original.id} />
            )}
          </Stack>
        ),
        enableSorting: false,
      },
    ],
    [formatProgrammeRights, getAllUsersQuery, iamGroups, roles]
  )

  const table = useMaterialReactTable({
    columns,
    data: users,
    defaultColumn: { size: 0 },
    enableBottomToolbar: false,
    enableColumnOrdering: false,
    enableDensityToggle: false,
    enableHiding: false,
    enablePagination: false,
    initialState: {
      showGlobalFilter: true,
    },
    state: {
      columnOrder: ['name', 'username', 'roles', 'programmeRights', 'iamGroups', 'lastLogin', 'actions'],
      columnVisibility: {
        name: true,
        username: true,
        roles: true,
        programmeRights: true,
        iamGroups: isDefaultServiceProvider(),
        lastLogin: true,
      },
    },
    renderTopToolbarCustomActions: ({ table }) => {
      const visibleEmails = table.getPrePaginationRowModel().rows.map(row => row.original.email)

      return (
        <Stack alignItems="center" direction="row" gap={1}>
          <CopyEmailAddressesButton userEmails={visibleEmails} />
          <StatusMessage isError={isError} isLoading={isLoading} />
        </Stack>
      )
    },
  })

  return <MaterialReactTable table={table} />
}
