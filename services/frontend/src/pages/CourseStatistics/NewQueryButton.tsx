import SearchIcon from '@mui/icons-material/Search'
import Button from '@mui/material/Button'
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
