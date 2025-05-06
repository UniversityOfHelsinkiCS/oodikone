import { Box, Card, CardContent, Checkbox, Chip, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import { isDefaultServiceProvider } from '@/common'
import { RoleChip } from '@/components/material/RoleChip'
import { useStatusNotification } from '@/components/material/StatusNotificationContext'
import { useGetRolesQuery, useModifyRolesMutation } from '@/redux/users'
import { User } from '@/types/api/users'
import { Role } from '@oodikone/shared/types'
import { CardHeader } from './CardHeader'
import { EditButton } from './EditButton'

export const RolesCard = ({ user }: { user: User }) => {
  const [selected, setSelected] = useState<string[]>(user.roles || [])
  const [editing, setEditing] = useState(false)
  const { data: roles = [] } = useGetRolesQuery()
  const [mutateRoles, result] = useModifyRolesMutation()
  const { setStatusNotification } = useStatusNotification()

  const toggleRole = (role: string) => {
    setSelected(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]))
  }

  const submit = async () => {
    if (selected === user.roles) {
      return
    }

    const newRoles = roles.reduce(
      (acc, role) => ({ ...acc, [role]: selected.includes(role) }),
      {} as Record<Role, boolean>
    )

    await mutateRoles({ username: user.username, roles: newRoles })
  }

  const handleEditClick = async () => {
    if (editing) {
      await submit()
    }
    setEditing(!editing)
  }

  useEffect(() => {
    if (result.isSuccess) {
      setStatusNotification('Roles updated successfully!', 'success')
    } else if (result.isError) {
      setStatusNotification('Failed to update roles.', 'error')
      setSelected(user.roles)
    }
  }, [result.isSuccess, result.isError, user.roles])

  return (
    <>
      <Card sx={{ height: '100%', width: '100%' }} variant="outlined">
        <CardHeader
          buttons={<EditButton disabled={result.isLoading} editing={editing} onClick={handleEditClick} />}
          title="Roles"
        />
        <CardContent>
          {roles.map(role => (
            <Box key={role} sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <RoleChip role={role} />
              <Stack direction="row" sx={{ alignItems: 'center' }}>
                {selected.includes(role) && <Chip color="success" label="Active" size="small" variant="outlined" />}
                <Checkbox
                  checked={selected.includes(role)}
                  color="success"
                  disabled={!editing || (!['admin', 'teachers'].includes(role) && isDefaultServiceProvider())}
                  onChange={() => toggleRole(role)}
                />
              </Stack>
            </Box>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
