import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { extractItems } from '@/common'
import { useStatusNotification } from '@/components/material/StatusNotificationContext'
import { useCreateStudentTagsMutation } from '@/redux/tags'
import { Tag } from '@/shared/types'

export const AddStudentsDialog = ({
  combinedProgramme,
  open,
  setOpen,
  studyTrack,
  tag,
}: {
  combinedProgramme: string
  open: boolean
  setOpen: (open: boolean) => void
  studyTrack: string
  tag: Tag
}) => {
  const { setStatusNotification } = useStatusNotification()
  const [input, setInput] = useState('')
  const parsedStudentNumbers = extractItems(input)
  const [createStudentTags, { isError, isLoading, isSuccess }] = useCreateStudentTagsMutation()

  useEffect(() => {
    if (isError) {
      setStatusNotification(
        `Failed to add students to tag ${tag.name}. Did you enter correct student numbers?`,
        'error'
      )
    }
  }, [isError, tag])

  useEffect(() => {
    if (isSuccess) {
      setStatusNotification(`Students added to tag ${tag.name}`, 'success')
    }
  }, [isSuccess, tag])

  const handleClick = async event => {
    event.preventDefault()
    await createStudentTags({
      combinedProgramme,
      studentTags: parsedStudentNumbers.map(studentNumber => ({
        studentNumber,
        tagId: tag.id,
      })),
      studyTrack,
    })
    setInput('')
    setOpen(false)
  }

  return (
    <Dialog open={open}>
      <DialogTitle>Add students to tag {tag.name}</DialogTitle>
      <DialogContent>
        <Stack gap={1}>
          <DialogContentText>Insert student numbers you wish to tag</DialogContentText>
          <TextField
            data-cy="add-students-text-field"
            minRows={3}
            multiline
            onChange={event => setInput(event.target.value)}
            placeholder="Separate each student number with a comma, semicolon, space, or newline"
            sx={{ width: 400 }}
            value={input}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} variant="outlined">
          Cancel
        </Button>
        <Button
          color="success"
          data-cy="add-students-confirm-button"
          disabled={isLoading || !parsedStudentNumbers.length}
          onClick={handleClick}
          variant="contained"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
