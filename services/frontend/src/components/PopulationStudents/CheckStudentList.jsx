import { arrayOf, string } from 'prop-types'
import React, { useState } from 'react'
import { Button, Modal, Form, TextArea, Accordion, Header, List } from 'semantic-ui-react'

export const CheckStudentList = ({ students }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')
  const [foundStudents, setFoundStudents] = useState([])
  const [notInOodiRows, setNotInOodiRows] = useState([])
  const [notInListRows, setNotInListRows] = useState([])

  const checkStudents = input => {
    const studentnumbers = input.match(/[^\s,]+/g) || []
    const foundStudents = studentnumbers.filter(a => students.includes(a))
    const notInOodi = studentnumbers.filter(a => !students.includes(a))
    const notInList = students.filter(a => !studentnumbers.includes(a))
    setFoundStudents(foundStudents)
    setNotInOodiRows(notInOodi)
    setNotInListRows(notInList)
  }

  const panels = [
    {
      key: 'found',
      title: 'Student numbers in list and in oodi',
      content: {
        content: foundStudents.length === 0 ? 'no numbers in list and oodi' : <List id="found" items={foundStudents} />,
      },
    },
    {
      key: 'not found',
      title: 'Student numbers in list but not in oodi',
      content: {
        content: notInOodiRows.length === 0 ? 'all numbers in oodi' : <List id="notfound" items={notInOodiRows} />,
      },
    },
    {
      key: 'not searched',
      title: 'Student numbers in oodi but not in list',
      content: {
        content: notInListRows.length === 0 ? 'all numbers in list' : <List id="notsearched" items={notInListRows} />,
      },
    },
  ]

  const renderResults = () => (
    <Modal
      trigger={
        <Button color="green" disabled={input.length === 0} onClick={() => checkStudents(input)}>
          check students
        </Button>
      }
    >
      <Modal.Content id="checkstudentsresults">
        <Header content="Results" />
        <Accordion styled exclusive={false} panels={panels} fluid />
      </Modal.Content>
      <Modal.Actions>
        <Button color="green" onClick={() => setModalOpen(false)} inverted>
          Close
        </Button>
      </Modal.Actions>
    </Modal>
  )

  return (
    <Modal
      trigger={
        <Button size="small" onClick={() => setModalOpen(true)}>
          Check studentnumbers
        </Button>
      }
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      size="small"
    >
      <Modal.Content>
        <Form>
          <h2> Check for studentnumbers </h2>
          <Form.Field>
            <em> Insert studentnumbers you wish to check here </em>
            <TextArea placeholder="011111111" onChange={e => setInput(e.target.value)} />
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
