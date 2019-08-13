import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { arrayOf, string, bool, func, shape } from 'prop-types'
import { Button, Modal, Form, TextArea, Dropdown } from 'semantic-ui-react'

import {
  createMultipleStudentTagAction
} from '../../../redux/tagstudent'

const TagModal = ({ tags, studytrack, createMultipleStudentTag, pending, success }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')
  const [selectedValue, setSelected] = useState('')

  useEffect(() => {
    if (!pending) {
      if (success) {
        setModalOpen(false)
      }
    }
  }, [pending])

  const handleClick = (event) => {
    event.preventDefault()
    const studentnumbers = input.match(/[0-9]+/g).filter(string => string.length === 9)
    const studentList = []
    studentnumbers.forEach((sn) => {
      const tag = {
        tag_id: selectedValue,
        studentnumber: sn
      }
      studentList.push(tag)
    })
    createMultipleStudentTag(studentList, studytrack)
  }

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setSelected(value)
  }


  const createdOptions = tags.map(tag => ({ key: tag.tag_id, text: tag.tagname, value: tag.tag_id }))

  return (
    <Modal
      trigger={<Button size="small" onClick={() => setModalOpen(true)}>Add tags to students</Button>}
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      size="small"
    >
      <Modal.Content>
        <Form>
          <h2> Add tags to students </h2>
          <Form.Field>
            <em> Select a tag </em>
            <Dropdown
              placeholder="Tag"
              search
              selection
              options={createdOptions}
              onChange={handleChange}
              value={selectedValue}
            />
            <em> Insert studentnumbers you wish to add tags to </em>
            <TextArea placeholder="011111111" onChange={e => setInput(e.target.value)} />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          negative
          onClick={() => setModalOpen(false)}
        >Cancel
        </Button>
        <Button
          positive
          onClick={event => handleClick(event)}
          disabled={pending}
        >
          Add tags
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

TagModal.propTypes = {
  createMultipleStudentTag: func.isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studytrack: string.isRequired,
  pending: bool.isRequired,
  success: bool.isRequired
}

const mapStateToProps = ({ tagstudent }) => ({
  pending: tagstudent.pending,
  success: tagstudent.success
})

export default withRouter(connect(mapStateToProps, {
  createMultipleStudentTag: createMultipleStudentTagAction
})(TagModal))
