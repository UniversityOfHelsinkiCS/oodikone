import { Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import qs from 'query-string'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { SearchHistory } from '@/components/material/SearchHistory'
import { StatusNotification } from '@/components/material/StatusNotification'
import {
  useCreateCourseListMutation,
  useDeleteCourseListMutation,
  useGetSavedCourseListsQuery,
  useUpdateCourseListMutation,
} from '@/redux/completedCoursesSearch'

export const SearchModal = ({ setValues }) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [displaySuccessNotification, setDisplaySuccessNotification] = useState(false)
  const [displayErrorNotification, setDisplayErrorNotification] = useState(false)
  const [courseInput, setCourseInput] = useState('')
  const [studentInput, setStudentInput] = useState('')
  const [name, setName] = useState('')
  const [selectedSearchId, setSelectedSearchId] = useState('')
  const { data: searchList = [], isFetching } = useGetSavedCourseListsQuery()
  const [updateCourseList] = useUpdateCourseListMutation()
  const [createCourseList] = useCreateCourseListMutation()
  const [deleteCourseList] = useDeleteCourseListMutation()

  const parseQueryFromUrl = useCallback(
    () => ({
      courseList: searchParams.getAll('courseList'),
      studentList: searchParams.getAll('studentList'),
    }),
    [searchParams]
  )

  const handleOpenModal = () => {
    setModalOpen(true)
    const { courseList, studentList } = parseQueryFromUrl()
    setCourseInput(courseList.join(', '))
    setStudentInput(studentList.join(', '))
  }

  useEffect(() => {
    const query = parseQueryFromUrl()
    setValues(query)
  }, [searchParams, parseQueryFromUrl, setValues])

  const clearForm = () => {
    setCourseInput('')
    setStudentInput('')
    setName('')
    setSelectedSearchId('')
  }

  const pushQueryToUrl = query => {
    const searchString = qs.stringify(query)
    void navigate({ search: searchString })
  }

  const handleClose = () => {
    setModalOpen(false)
    clearForm()
  }

  const onDelete = async () => {
    await deleteCourseList({ id: selectedSearchId })
    clearForm()
  }

  const onSave = async () => {
    const courseList = courseInput
      .split(/[\s,]+/)
      .map(code => code.trim())
      .filter(code => code !== '')
    const result =
      selectedSearchId !== ''
        ? await updateCourseList({ id: selectedSearchId, courseList })
        : await createCourseList({ courseList, name })

    if (result.data) {
      setDisplaySuccessNotification(true)
    } else {
      setDisplayErrorNotification(true)
    }
  }

  const onSelectSearch = selectedId => {
    if (!selectedId) {
      clearForm()
      return
    }
    const { id: selectedSearchId } = selectedId
    const selectedSearch = searchList.find(search => search.id === selectedSearchId)
    if (selectedSearch) {
      setCourseInput(selectedSearch.courseList.join(', '))
      setName(selectedSearch.name)
      setSelectedSearchId(selectedSearch.id)
    }
  }

  const onClicker = event => {
    event.preventDefault()

    const courseList = courseInput
      .split(/[;\s,]+/)
      .map(code => code.trim())
      .filter(code => code !== '')
    const studentList = studentInput
      .split(/[;\s,]+/)
      .map(code => code.trim())
      .filter(s => s !== '')
      .map(s => (s.length === 8 ? `0${s}` : s))

    setValues({ studentList, courseList })
    pushQueryToUrl({ courseList, studentList })
    handleClose()
  }

  return (
    <>
      <Button data-cy="open-completed-courses-modal-button" onClick={handleOpenModal} variant="contained">
        Search completed courses of students
      </Button>
      <Dialog maxWidth="md" onClose={handleClose} open={modalOpen}>
        <DialogTitle>Search completed courses of students</DialogTitle>
        <StatusNotification
          message="The course list was saved successfully."
          onClose={() => setDisplaySuccessNotification(false)}
          open={displaySuccessNotification}
          severity="success"
        />
        <StatusNotification
          message="An error occurred while saving the course list. Please try again."
          onClose={() => setDisplayErrorNotification(false)}
          open={displayErrorNotification}
          severity="error"
        />
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2">
                Insert one or more student numbers, separated by a space, a newline, a comma, or a semicolon.
              </Typography>
              <TextField
                data-cy="student-no-input"
                fullWidth
                minRows={3}
                multiline
                onChange={event => setStudentInput(event.target.value)}
                placeholder="012345678, 012345679"
                value={studentInput}
              />
            </Box>
            <Box>
              <Typography variant="body2">
                Insert one or more courses, separated by a space, a newline, a comma, or a semicolon.
              </Typography>
              <TextField
                data-cy="course-list-input"
                fullWidth
                minRows={3}
                multiline
                onChange={event => setCourseInput(event.target.value)}
                placeholder="TKT12345, PSYK-123"
                value={courseInput}
              />
            </Box>
            <Box>
              <Typography variant="body2">Insert name for this course list if you wish to save it.</Typography>
              <TextField
                data-cy="search-name"
                disabled={selectedSearchId !== ''}
                fullWidth
                onChange={event => setName(event.target.value)}
                placeholder="name"
                value={name}
              />
            </Box>
            <SearchHistory
              handleSearch={onSelectSearch}
              header="Saved course lists"
              items={searchList.map(({ id, name, updatedAt }) => ({
                id,
                text: name,
                timestamp: updatedAt,
                params: { id },
              }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            color="primary"
            data-cy="save-courselist"
            disabled={!name || isFetching}
            onClick={onSave}
            startIcon={<SaveIcon />}
            variant="contained"
          >
            Save
          </Button>
          <Button
            color="error"
            data-cy="delete-courselist"
            disabled={!selectedSearchId || isFetching}
            onClick={onDelete}
            startIcon={<DeleteIcon />}
            variant="contained"
          >
            Delete
          </Button>
          <Button
            data-cy="completed-courses-search-button"
            disabled={courseInput.trim() === '' || studentInput.trim() === ''}
            onClick={event => onClicker(event)}
            variant="contained"
          >
            Search
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
