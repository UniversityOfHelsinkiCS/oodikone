import { Logout as LogoutIcon, PersonSearch as PersonSearchIcon } from '@mui/icons-material'
import { Button } from '@mui/material'

import { useGetAuthorizedUserQuery, useShowAsUser } from '@/redux/auth'

export const MockButton = ({ username }: { username: string }) => {
  const showAsUser = useShowAsUser()
  const { mockedBy, username: loggedInAs } = useGetAuthorizedUserQuery()

  const isBeingMocked = mockedBy && username === loggedInAs

  return (
    <Button
      color={isBeingMocked ? 'error' : 'warning'}
      data-cy="mock-button"
      onClick={() => showAsUser(isBeingMocked ? null : username)}
      size="small"
      startIcon={isBeingMocked ? <LogoutIcon /> : <PersonSearchIcon />}
      variant="outlined"
    >
      {isBeingMocked ? 'Stop' : 'Mock'}
    </Button>
  )
}
