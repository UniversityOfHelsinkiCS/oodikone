import Button from '@mui/material/Button'

import { useGetAuthorizedUserQuery, useShowAsUser } from '@/redux/auth'
import { LogoutIcon, PersonSearchIcon } from '@/theme'

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
