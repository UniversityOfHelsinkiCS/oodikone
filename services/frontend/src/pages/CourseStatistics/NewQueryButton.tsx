import Button from '@mui/material/Button'
import { useNavigate } from 'react-router'

import { SearchIcon } from '@/theme'

export const NewQueryButton = () => {
  const navigate = useNavigate()

  return (
    <Button
      data-cy="NewQueryButton"
      endIcon={<SearchIcon />}
      onClick={() => void navigate('/coursestatistics')}
      variant="text"
    >
      New query
    </Button>
  )
}
