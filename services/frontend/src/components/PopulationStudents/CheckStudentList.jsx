import { arrayOf, string } from 'prop-types'
import React, { useState } from 'react'
import { Accordion, Button, Form, Header, List, Modal, TextArea } from 'semantic-ui-react'

export const CheckStudentList = ({ students }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')
  const [foundStudents, setFoundStudents] = useState([])
  const [notInSisuRows, setNotInSisuRows] = useState([])
  const [notInListRows, setNotInListRows] = useState([])

  const checkStudents = input => {
    const studentnumbers = input.match(/[^\s,]+/g) || []
    const foundStudents = studentnumbers.filter(studentnumber => students.includes(studentnumber))
    const notInSisu = studentnumbers.filter(studentnumber => !students.includes(studentnumber))
    const notInList = students.filter(student => !studentnumbers.includes(student))
    setFoundStudents(foundStudents)
    setNotInSisuRows(notInSisu)
    setNotInListRows(notInList)
  }

  const panels = [
    {
      key: 'found',
      title: 'Student numbers in list and in Sisu',
      content: {
        content: foundStudents.length === 0 ? 'No numbers in list and Sisu' : <List id="found" items={foundStudents} />,
      },
    },
    {
      key: 'not found',
      title: 'Student numbers in list but not in Sisu',
      content: {
        content: notInSisuRows.length === 0 ? 'All numbers in Sisu' : <List id="notfound" items={notInSisuRows} />,
      },
    },
    {
      key: 'not searched',
      title: 'Student numbers in Sisu but not in list',
      content: {
        content: notInListRows.length === 0 ? 'All numbers in list' : <List id="notsearched" items={notInListRows} />,
      },
    },
  ]

  const renderResults = () => (
    <Modal
      trigger={
        <Button color="green" disabled={input.length === 0} onClick={() => checkStudents(input)}>
          Check students
        </Button>
      }
    >
      <Modal.Content id="checkstudentsresults">
        <Header content="Results" />
        <Accordion exclusive={false} fluid panels={panels} styled />
      </Modal.Content>
      <Modal.Actions>
        <Button color="green" inverted onClick={() => setModalOpen(false)}>
          Close
        </Button>
      </Modal.Actions>
    </Modal>
  )

  return (
    <Modal
      onClose={() => setModalOpen(false)}
      open={modalOpen}
      size="small"
      trigger={
        <Button onClick={() => setModalOpen(true)} size="small">
          Check student numbers
        </Button>
      }
    >
      <Modal.Content>
        <Form>
          <h2>Check for student numbers</h2>
          <Form.Field>
            <em>Insert student numbers you wish to check here</em>
            <TextArea onChange={element => setInput(element.target.value)} placeholder="011111111" />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button negative onClick={() => setModalOpen(false)}>
          Cancel
        </Button>
        {renderResults()}
      </Modal.Actions>
    </Modal>
  )
}

CheckStudentList.propTypes = {
  students: arrayOf(string).isRequired,
}
