import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, TextArea, Loader } from 'semantic-ui-react'
import qs from 'query-string'
import {
  useGetSavedCourseListsQuery,
  useCreateCourseListMutation,
  useUpdateCourseListMutation,
  useDeleteCourseListMutation,
} from 'redux/completedCoursesSearch'
import SearchHistory from 'components/SearchHistory'

const CompletedCoursesSearch = ({ setValues, history, location }) => {
  const [modal, setModal] = useState(false)
  const [courseInput, setCourseInput] = useState('')
  const [studentInput, setStudentInput] = useState('')
  const [name, setName] = useState('')
  const courseLists = useGetSavedCourseListsQuery()
  const [searchList, setSearches] = useState(null)
  const [selectedSearchId, setSelectedSearchId] = useState('')
  const isFetchingOrLoading = courseLists.isLoading || courseLists.isFetching
  const isError = courseLists.isError || (courseLists.isSuccess && !courseLists.data)
  const [updateCourseList, { isLoading: updateIsLoading, data: updatedData }] = useUpdateCourseListMutation()
  const [createCourseList, { isLoading: createIsLoading, data: createdData }] = useCreateCourseListMutation()
  const [deleteCourseList, { isLoading: deleteIsLoading, data: deletedData }] = useDeleteCourseListMutation()

  const parseQueryFromUrl = () => {
    const query = qs.parse(location.search)
    if (!Array.isArray(query.courseList)) query.courseList = [query.courseList]
    if (!Array.isArray(query.studentList)) query.studentList = [query.studentList]
    return query
  }

  useEffect(() => {
    if (courseLists.isSuccess && courseLists.data) {
      setSearches(courseLists.data)
    }
  }, [courseLists])

  useEffect(() => {
    if (updatedData) {
      const updatedSearches = searchList.map(s => (s.id === updatedData.id ? updatedData : s))
      setSearches(updatedSearches)
    }
  }, [updatedData])

  useEffect(() => {
    if (createdData && !createdData.error) {
      const newList = searchList.concat(createdData)
      setSearches(newList)
    }
  }, [createdData])

  useEffect(() => {
    if (deletedData) {
      const filteredsearches = searchList.filter(s => s.id !== deletedData)
      setSearches(filteredsearches)
    }
  }, [deletedData])

  useEffect(() => {
    setImmediate(() => {
      if (location.search) {
        const query = parseQueryFromUrl()
        setValues(query)
      }
    })
  }, [location.search])

  const clearForm = () => {
    setCourseInput('')
    setStudentInput('')
    setSelectedSearchId('')
  }

  const pushQueryToUrl = query => {
    setImmediate(() => {
      const searchString = qs.stringify(query)
      history.push({ search: searchString })
    })
  }

  const handleClose = () => {
    setModal(false)
    clearForm()
  }

  const onDelete = () => {
    deleteCourseList({ id: selectedSearchId })
    clearForm()
  }

  const onSave = () => {
    const courseList = courseInput
      .split(/[\s,]+/)
      .map(code => code.trim().toUpperCase())
      .filter(code => code !== '')
    if (selectedSearchId !== '') {
      updateCourseList({ id: selectedSearchId, courseList })
    } else {
      createCourseList({ courseList, name })
    }
  }
  const onSelectSearch = selectedId => {
    if (!selectedId) {
      clearForm()
      return
    }
    const { id: selectedSearchId } = selectedId
    const selectedSearch = searchList?.find(search => search.id === selectedSearchId)
    if (selectedSearch) {
      setCourseInput(selectedSearch.courseList.join(', '))
      setName(selectedSearch.name)
      setSelectedSearchId(selectedSearch.id)
    }
  }

  const onClicker = e => {
    e.preventDefault()

    const courseList = courseInput
      .split(/[\s,]+/)
      .map(code => code.trim().toUpperCase())
      .filter(c => c !== '')
    const studentList = studentInput
      .split(/[;\s,]+/)
      .map(code => code.trim())
      .filter(s => s !== '')
      .map(s => (s.length === 8 ? `0${s}` : s))

    if (courseList.length === 0 || studentList.length === 0 || studentList[0] === null) {
      return
    }

    setValues({
      studentList,
      courseList,
    })

    pushQueryToUrl({ courseList, studentList })

    handleClose()
  }

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading) return <Loader active style={{ marginTop: '15em' }} />

  return (
    <Modal
      trigger={
        <Button size="small" color="blue" onClick={() => setModal(true)} data-cy="open-completed-courses-modal-button">
          Search completed courses of students
        </Button>
      }
      open={modal}
      onClose={handleClose}
      size="small"
    >
      <Modal.Content>
        <Form>
          <h2>Search completed courses of students</h2>
          <Form.Field>
            <em>Insert one or more student numbers, separated by a space, a newline, or a comma.</em>
            <TextArea
              value={studentInput}
              placeholder="012345678, 12345678"
              onChange={e => setStudentInput(e.target.value)}
              data-cy="student-no-input"
            />
          </Form.Field>
          <Form.Field>
            <em>Insert one or more courses, separated by a space, a newline, or a comma.</em>
            <TextArea
              value={courseInput}
              placeholder="TKT12345, PSYK-123"
              onChange={e => setCourseInput(e.target.value)}
              data-cy="course-list-input"
            />
          </Form.Field>
          <Form.Field>
            <Form.Field data-cy="search-name">
              <em> Insert name for this course list if you wish to save it </em>
              <Form.Input
                disabled={selectedSearchId !== ''}
                value={name}
                placeholder="name"
                onChange={e => setName(e.target.value)}
              />
            </Form.Field>
          </Form.Field>
          <SearchHistory
            header="Saved courselists"
            items={
              searchList
                ? searchList.map(list => ({
                    ...list,
                    text: list.name,
                    timestamp: new Date(list.updatedAt),
                    params: { id: list.id },
                  }))
                : []
            }
            updateItem={() => null}
            handleSearch={onSelectSearch}
          />
          <Modal.Actions>
            <Button
              data-cy="save-courselist"
              disabled={!name || updateIsLoading || createIsLoading}
              loading={updateIsLoading || createIsLoading}
              floated="left"
              icon="save"
              onClick={onSave}
              content="Save"
            />
            <Button
              disabled={!selectedSearchId || deleteIsLoading}
              negative
              floated="left"
              icon="trash"
              onClick={onDelete}
              content="Delete"
            />

            <Button onClick={handleClose}>Cancel</Button>
            <Button positive onClick={e => onClicker(e)} data-cy="completed-courses-search-button">
              Search
            </Button>
          </Modal.Actions>
        </Form>
      </Modal.Content>
    </Modal>
  )
}

export default CompletedCoursesSearch
