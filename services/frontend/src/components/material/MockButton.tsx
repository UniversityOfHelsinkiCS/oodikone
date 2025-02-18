import { PersonSearch as PersonSearchIcon } from '@mui/icons-material'
import { Button } from '@mui/material'

import { useShowAsUser } from '@/redux/auth'

export const MockButton = ({ username }: { username: string }) => {
  const showAsUser = useShowAsUser()

  return (
    <Button
      color="warning"
      onClick={() => showAsUser(username)}
      size="small"
      startIcon={<PersonSearchIcon />}
      variant="outlined"
    >
      Mock
    </Button>
  )
}
