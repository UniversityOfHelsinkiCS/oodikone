import { Box, Chip, Stack } from '@mui/material'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useCallback, useMemo } from 'react'
import { Link } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { MockButton } from '@/components/material/MockButton'
import { RoleChip } from '@/components/material/RoleChip'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetRolesQuery } from '@/redux/users'
import { DetailedProgrammeRights, Role } from '@/shared/types'
import { User } from '@/types/api/users'
import { reformatDate } from '@/util/timeAndDate'
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
          <Link data-cy={`user-edit-button-${row.original.username}`} to={`/users/${row.original.id}`}>
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
      },
      {
        accessorKey: 'lastLogin',
        header: 'Last login',
        Cell: ({ cell }) => reformatDate(cell.getValue<string>(), DISPLAY_DATE_FORMAT),
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
    [formatProgrammeRights, getAllUsersQuery, roles]
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
