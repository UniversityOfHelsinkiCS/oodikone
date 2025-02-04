import { Search as SearchIcon } from '@mui/icons-material'
import { Button } from '@mui/material'
import { useNavigate } from 'react-router'

export const NewQueryButton = () => {
  const navigate = useNavigate()

  return (
    <Button
      data-cy="NewQueryButton"
      endIcon={<SearchIcon />}
      onClick={() => navigate('/coursestatistics')}
      variant="text"
    >
      New query
    </Button>
  )
}
