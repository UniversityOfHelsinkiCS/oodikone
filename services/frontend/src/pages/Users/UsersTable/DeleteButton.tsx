import { PersonRemove as PersonRemoveIcon, Warning as WarningIcon } from '@mui/icons-material'
import { Button } from '@mui/material'
import { useEffect, useState } from 'react'

import { useDeleteUserMutation } from '@/redux/users'

export const DeleteButton = ({ getAllUsersQuery, userId }: { getAllUsersQuery: any; userId: string }) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteUserMutation, { data: deletedUser }] = useDeleteUserMutation()

  useEffect(() => {
    if (deletedUser) {
      setConfirmDeleteId(null)
      getAllUsersQuery()
    }
  }, [deletedUser, getAllUsersQuery])

  const deleteUser = (userId: string) => {
    void deleteUserMutation(userId)
  }

  const onClick = (userId: string) => {
    if (confirmDeleteId !== userId) {
      setConfirmDeleteId(userId)
    } else {
      deleteUser(userId)
    }
  }

  return (
    <Button
      color={confirmDeleteId !== userId ? 'error' : 'warning'}
      onClick={() => onClick(userId)}
      size="small"
      startIcon={confirmDeleteId == userId ? <WarningIcon /> : <PersonRemoveIcon />}
      variant="outlined"
    >
      {confirmDeleteId !== userId ? 'Delete' : 'Confirm'}
    </Button>
  )
}
