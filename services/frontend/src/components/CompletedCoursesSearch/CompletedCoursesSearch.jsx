import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, TextArea } from 'semantic-ui-react'
import qs from 'query-string'

const CompletedCoursesSearch = ({ setValues, history, location }) => {
  const [modal, setModal] = useState(false)
  const [courseInput, setCourseInput] = useState('')
  const [studentInput, setStudentInput] = useState('')

  const parseQueryFromUrl = () => {
    const query = qs.parse(location.search)
    if (!Array.isArray(query.courseList)) query.courseList = [query.courseList]
    if (!Array.isArray(query.studentList)) query.studentList = [query.studentList]
    return query
  }

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

  const onClicker = e => {
    e.preventDefault()

    const courseList = courseInput
      .split(/[\s,]+/)
      .map(code => code.trim().toUpperCase())
      .filter(c => c !== '')
    const studentList = studentInput
      .split(/[\s,]+/)
      .map(code => code.trim().toUpperCase())
      .filter(s => s !== '')
      .map(s => (s.length === 8 ? `0${s}` : s))

    setValues({
      studentList,
      courseList,
    })

    pushQueryToUrl({ courseList, studentList })

    handleClose()
  }

  return (
    <Modal
      trigger={
        <Button size="small" color="blue" onClick={() => setModal(true)} data-cy="completed-courses-search-button">
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
            />
          </Form.Field>
          <Form.Field>
            <em>Insert one or more courses, separated by a space, a newline, or a comma.</em>
            <TextArea
              value={courseInput}
              placeholder="TKT12345, PSYK-123"
              onChange={e => setCourseInput(e.target.value)}
            />
          </Form.Field>
          <Modal.Actions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button positive onClick={e => onClicker(e)} data-cy="search-button">
              Search students
            </Button>
          </Modal.Actions>
        </Form>
      </Modal.Content>
    </Modal>
  )
}

export default CompletedCoursesSearch
