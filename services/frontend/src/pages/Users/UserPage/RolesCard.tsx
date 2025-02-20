import { AlertProps, Box, Card, CardContent, Checkbox, Chip, Divider, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { RoleChip } from '@/components/material/RoleChip'
import { StatusNotification } from '@/components/material/StatusNotification'
import { useGetRolesQuery, useModifyRolesMutation } from '@/redux/users'
import { Role } from '@/shared/types'
import { User } from '@/types/api/users'
import { EditButton } from './EditButton'

export const RolesCard = ({ user }: { user: User }) => {
  const [selected, setSelected] = useState<string[]>(user.roles || [])
  const [editing, setEditing] = useState(false)
  const { data: roles = [] } = useGetRolesQuery()
  const [mutateRoles, result] = useModifyRolesMutation()
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: undefined as AlertProps['severity'],
  })

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
      setNotification({ open: true, message: 'Roles updated successfully!', severity: 'success' })
    } else if (result.isError) {
      setNotification({ open: true, message: 'Failed to update roles.', severity: 'error' })
      setSelected(user.roles)
    }
  }, [result.isSuccess, result.isError, user.roles])

  return (
    <>
      <Card sx={{ height: '100%', width: '100%' }} variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Typography component="h2" variant="h5">
              Roles
            </Typography>
            <EditButton disabled={result.isLoading} editing={editing} onClick={handleEditClick} />
          </Stack>
        </CardContent>
        <Divider />
        <CardContent>
          {roles.map(role => (
            <Box key={role} sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <RoleChip role={role} />
              <Stack direction="row" sx={{ alignItems: 'center' }}>
                {selected.includes(role) && <Chip color="success" label="Active" size="small" variant="outlined" />}
                <Checkbox
                  checked={selected.includes(role)}
                  color="success"
                  disabled={!editing || !['admin', 'teachers'].includes(role)}
                  onChange={() => toggleRole(role)}
                />
              </Stack>
            </Box>
          ))}
        </CardContent>
      </Card>
      <StatusNotification
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        open={notification.open}
        severity={notification.severity}
      />
    </>
  )
}
