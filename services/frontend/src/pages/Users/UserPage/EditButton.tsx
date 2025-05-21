import CheckIcon from '@mui/icons-material/Check'
import EditIcon from '@mui/icons-material/Edit'
import Button from '@mui/material/Button'

export const EditButton = ({ disabled, editing, onClick }: { disabled: boolean; editing: boolean; onClick: any }) => {
  return (
    <Button
      color={editing ? 'success' : 'primary'}
      disabled={disabled}
      endIcon={editing ? <CheckIcon /> : <EditIcon />}
      onClick={onClick}
    >
      {editing ? 'Save' : 'Edit'}
    </Button>
  )
}
