import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { useCreateStudentTagsMutation, useDeleteStudentTagsMutation } from '@/redux/tags'

export const TagPopulation = ({ programme, combinedProgramme, selectedStudents, tags }) => {
  const [options, setOptions] = useState([])
  const [selectedValue, setSelected] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [confirmAdd, setConfirmAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [createStudentTags] = useCreateStudentTagsMutation()
  const [deleteStudentTags] = useDeleteStudentTagsMutation()

  useEffect(() => {
    const createdOptions = tags.map(tag => ({ key: tag.id, text: tag.name, value: tag.id }))
    setOptions(createdOptions)
  }, [])

  const handleChange = event => {
    const { value } = event.target

    setSelected(value)
    const foundTag = tags.find(tag => tag.id === value)
    setSelectedTag(foundTag)
  }

  const handleDelete = () => {
    void deleteStudentTags({
      combinedProgramme,
      tagId: selectedValue,
      studentNumbers: selectedStudents,
      studyTrack: programme,
    })
    setSelected('')
    setConfirmDelete(false)
  }

  const handleAdd = () => {
    const tagList = []
    selectedStudents.forEach(studentNumber => {
      tagList.push({
        studentNumber,
        tagId: selectedValue,
      })
    })
    setSelected('')
    void createStudentTags({ combinedProgramme, studyTrack: programme, studentTags: tagList })
    setConfirmAdd(false)
  }

  const addConfirm = (
    <Dialog onClose={() => setConfirmAdd(false)} open={confirmAdd ? !!selectedTag : false}>
      <Paper sx={{ padding: 2 }}>
        <Typography variant="h6">
          Are you sure you want to add tag "{selectedTag ? selectedTag.name : null}" to {selectedStudents.length}{' '}
          students?
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Button color="error" onClick={() => setConfirmAdd(false)} variant="outlined">
            Cancel
          </Button>
          <Button color="primary" onClick={() => handleAdd()} sx={{ ml: 0.5 }} variant="outlined">
            Confirm
          </Button>
        </Box>
      </Paper>
    </Dialog>
  )

  const deleteConfirm = (
    <Dialog onClose={() => setConfirmDelete(false)} open={confirmDelete ? !!selectedTag : false}>
      <Paper sx={{ padding: 2 }}>
        <Typography variant="h6">
          Are you sure you want to delete tag "{selectedTag ? selectedTag.name : null}" from {selectedStudents.length}{' '}
          students?
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Button color="primary" onClick={() => setConfirmDelete(false)} variant="outlined">
            Cancel
          </Button>
          <Button color="error" onClick={() => handleDelete()} sx={{ ml: 0.5 }} variant="outlined">
            Delete
          </Button>
        </Box>
      </Paper>
    </Dialog>
  )

  return (
    <Paper sx={{ padding: 2 }} variant="outlined">
      <Stack flexDirection="row" sx={{ gap: 1 }}>
        <Select
          data-cy="course-providers"
          onChange={handleChange}
          size="small"
          sx={{ minWidth: '32em' }}
          value={selectedValue ?? ''}
          variant="outlined"
        >
          {options.map(({ key, value, text }) => (
            <MenuItem key={key} value={value}>
              {text}
            </MenuItem>
          ))}
        </Select>
        <Button color="primary" disabled={selectedValue === ''} onClick={() => setConfirmAdd(true)} variant="outlined">
          Add tag to {selectedStudents.length} students
        </Button>
        <Button color="error" disabled={selectedValue === ''} onClick={() => setConfirmDelete(true)} variant="outlined">
          Delete tag from {selectedStudents.length} students
        </Button>
      </Stack>
      {deleteConfirm}
      {addConfirm}
    </Paper>
  )
}
