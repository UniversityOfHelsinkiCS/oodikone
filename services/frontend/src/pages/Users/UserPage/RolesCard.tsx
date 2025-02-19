import { Check as CheckIcon, Edit as EditIcon } from '@mui/icons-material'
import { AlertProps, Box, Button, Card, CardContent, Checkbox, Divider, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { RoleChip } from '@/components/material/RoleChip'
import { StatusNotification } from '@/components/material/StatusNotification'
import { roles } from '@/constants/roles'
import { useModifyAccessGroupsMutation } from '@/redux/users'
import { Role } from '@/shared/types'

export const RolesCard = ({ user }) => {
  const [selected, setSelected] = useState<string[]>(user.roles || [])
  const [editing, setEditing] = useState(false)
  const [mutateAccessGroups, result] = useModifyAccessGroupsMutation()
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: undefined as AlertProps['severity'],
  })

  const toggleRole = (role: string) => {
    setSelected(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]))
  }

  const submit = async () => {
    const accessgroups = roles.reduce(
      (acc, role) => ({ ...acc, [role]: selected.includes(role) }),
      {} as Record<Role, boolean>
    )
    await mutateAccessGroups({ username: user.username, accessgroups })
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
    }
  }, [result.isSuccess, result.isError])

  return (
    <>
      <Card sx={{ width: '100%' }} variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Typography component="h2" variant="h5">
              Roles
            </Typography>
            <Button
              color={editing ? 'success' : 'warning'}
              disabled={result.isLoading}
              endIcon={editing ? <CheckIcon /> : <EditIcon />}
              onClick={handleEditClick}
              variant="outlined"
            >
              {editing ? 'Save' : 'Edit'}
            </Button>
          </Stack>
        </CardContent>
        <Divider />
        <CardContent>
          {roles.map(role => (
            <Box key={role} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <RoleChip role={role} />
              <Checkbox checked={selected.includes(role)} disabled={!editing} onChange={() => toggleRole(role)} />
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
