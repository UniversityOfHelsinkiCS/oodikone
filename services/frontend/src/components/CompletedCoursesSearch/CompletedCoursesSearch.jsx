import qs from 'query-string'
import React, { useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Button, Form, Loader, Modal, TextArea } from 'semantic-ui-react'

import { SearchHistory } from '@/components/SearchHistory'
import {
  useCreateCourseListMutation,
  useDeleteCourseListMutation,
  useGetSavedCourseListsQuery,
  useUpdateCourseListMutation,
} from '@/redux/completedCoursesSearch'

export const CompletedCoursesSearch = ({ setValues }) => {
  const location = useLocation()
  const history = useHistory()
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
      const filteredSearches = searchList.filter(s => s.id !== deletedData)
      setSearches(filteredSearches)
    }
  }, [deletedData])

  useEffect(() => {
    if (location.search) {
      const query = parseQueryFromUrl()
      setValues(query)
    }
  }, [location.search])

  const clearForm = () => {
    setCourseInput('')
    setStudentInput('')
    setSelectedSearchId('')
  }

  const pushQueryToUrl = query => {
    const searchString = qs.stringify(query)
    history.push({ search: searchString })
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
      .map(code => code.trim())
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

  const onClicker = event => {
    event.preventDefault()

    const courseList = courseInput
      .split(/[\s,]+/)
      .map(code => code.trim())
      .filter(code => code !== '')
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
      onClose={handleClose}
      open={modal}
      size="small"
      trigger={
        <Button color="blue" data-cy="open-completed-courses-modal-button" onClick={() => setModal(true)} size="small">
          Search completed courses of students
        </Button>
      }
    >
      <Modal.Content>
        <Form>
          <h2>Search completed courses of students</h2>
          <Form.Field>
            <em>Insert one or more student numbers, separated by a space, a newline, a comma, or a semicolon.</em>
            <TextArea
              data-cy="student-no-input"
              onChange={event => setStudentInput(event.target.value)}
              placeholder="012345678, 12345678"
              value={studentInput}
            />
          </Form.Field>
          <Form.Field>
            <em>Insert one or more courses, separated by a space, a newline, or a comma.</em>
            <TextArea
              data-cy="course-list-input"
              onChange={event => setCourseInput(event.target.value)}
              placeholder="TKT12345, PSYK-123"
              value={courseInput}
            />
          </Form.Field>
          <Form.Field>
            <Form.Field data-cy="search-name">
              <em> Insert name for this course list if you wish to save it </em>
              <Form.Input
                disabled={selectedSearchId !== ''}
                onChange={event => setName(event.target.value)}
                placeholder="name"
                value={name}
              />
            </Form.Field>
          </Form.Field>
          <SearchHistory
            handleSearch={onSelectSearch}
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
          />
          <Modal.Actions>
            <Button
              content="Save"
              data-cy="save-courselist"
              disabled={!name || updateIsLoading || createIsLoading}
              floated="left"
              icon="save"
              loading={updateIsLoading || createIsLoading}
              onClick={onSave}
            />
            <Button
              content="Delete"
              disabled={!selectedSearchId || deleteIsLoading}
              floated="left"
              icon="trash"
              negative
              onClick={onDelete}
            />

            <Button onClick={handleClose}>Cancel</Button>
            <Button data-cy="completed-courses-search-button" onClick={event => onClicker(event)} positive>
              Search
            </Button>
          </Modal.Actions>
        </Form>
      </Modal.Content>
    </Modal>
  )
}
