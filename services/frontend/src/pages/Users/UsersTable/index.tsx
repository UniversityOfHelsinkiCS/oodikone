import { Box, Chip, Stack } from '@mui/material'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useGetProgrammesQuery } from '@/redux/populations'
import { DetailedProgrammeRights, Role } from '@/shared/types'
import { User } from '@/types/api/users'
import { reformatDate } from '@/util/timeAndDate'
import { CopyEmailAddressesButton } from './CopyEmailAddressesButton'
import { DeleteButton } from './DeleteButton'
import { MockButton } from './MockButton'
import { RoleChip } from './RoleChip'

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
  const [userEmails, setUserEmails] = useState<string[]>([])
  const { data: studyProgrammes = {} } = useGetProgrammesQuery({})

  useEffect(() => {
    setUserEmails(users.map(user => user.email))
  }, [users])

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
      return `${programmeNames[0]} + ${programmeNames.length - 1} others`
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
    [formatProgrammeRights, getAllUsersQuery]
  )

  const table = useMaterialReactTable({
    columns,
    data: users,
    defaultColumn: { size: 0 },
    enableColumnOrdering: false,
    enableDensityToggle: false,
    enableHiding: false,
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
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
    renderTopToolbarCustomActions: () => <CopyEmailAddressesButton userEmails={userEmails} />,
  })

  return (
    <Section isError={isError} isLoading={isLoading}>
      <MaterialReactTable table={table} />
    </Section>
  )
}
