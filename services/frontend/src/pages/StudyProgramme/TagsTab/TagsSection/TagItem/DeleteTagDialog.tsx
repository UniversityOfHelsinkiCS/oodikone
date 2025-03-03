import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

import { useDeleteTagMutation } from '@/redux/tags'
import { Tag } from '@/shared/types'

export const DeleteTagDialog = ({
  setTagToDelete,
  tag,
  tagToDelete,
}: {
  setTagToDelete: (value: Tag | null) => void
  tag: Tag
  tagToDelete: Tag | null
}) => {
  const [deleteTag] = useDeleteTagMutation()

  const handleDeleteTag = (event, tag: Tag) => {
    event.preventDefault()
    void deleteTag(tag)
    setTagToDelete(null)
  }

  return (
    <Dialog open={tagToDelete?.id === tag.id}>
      <DialogTitle>Delete tag</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete tag <b>{tag.name}</b>? If you press confirm you will delete it from all
          students that have it. You and other users won't be able to use this tag again.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTagToDelete(null)} variant="outlined">
          Cancel
        </Button>
        <Button color="error" onClick={event => handleDeleteTag(event, tag)} variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
