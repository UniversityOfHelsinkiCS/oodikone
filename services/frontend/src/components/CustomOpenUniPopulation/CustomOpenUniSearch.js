import React, { useState } from 'react'
import { Modal, Form, Button, TextArea } from 'semantic-ui-react'

const CustomOpenUniSearch = ({ setCourses }) => {
  const [modal, setModal] = useState(false)
  const [input, setInput] = useState('')

  const clearForm = () => {
    setInput('')
  }

  const handleClose = () => {
    setModal(false)
    clearForm()
  }

  const onClicker = e => {
    e.preventDefault()
    const courseList = input
      .split(',')
      .map(code => code.trim().toUpperCase())
      .filter(code => code.length > 0)
    setCourses(courseList)
    handleClose()
  }

  return (
    <Modal
      trigger={
        <Button size="small" color="blue" onClick={() => setModal(true)} data-cy="custom-pop-search-button">
          Fetch Open Uni Students
        </Button>
      }
      open={modal}
      onClose={handleClose}
      size="small"
    >
      <Modal.Content>
        <Form>
          <h2> Fetch open uni course population</h2>
          <Form.Field>
            <em> Insert course code(s).</em>
            <TextArea
              value={input}
              placeholder="TKT-12345, PSYK-12345"
              onChange={e => setInput(e.target.value)}
              data-cy="student-no-input"
            />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button positive onClick={e => onClicker(e)} data-cy="search-button">
          Search population
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export default CustomOpenUniSearch
