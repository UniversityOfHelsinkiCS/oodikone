import { arrayOf, bool, func, shape, string } from 'prop-types'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Button, Dropdown, Form, Message, Modal, TextArea } from 'semantic-ui-react'

import { createMultipleStudentTagAction } from '@/redux/tagstudent'

const TagModal = ({ combinedProgramme, createMultipleStudentTag, error, pending, studytrack, success, tags }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')
  const [selectedValue, setSelected] = useState('')

  useEffect(() => {
    if (!pending) {
      if (success) {
        setModalOpen(false)
        setSelected('')
        setInput('')
      }
    }
  }, [pending])

  const handleClick = event => {
    event.preventDefault()
    const studentnumbers = input.match(/[^\s,]+/g)
    createMultipleStudentTag(
      studentnumbers.map(studentNumber => ({
        tag_id: selectedValue,
        studentnumber: studentNumber,
      })),
      studytrack,
      combinedProgramme
    )
  }

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setSelected(value)
  }

  const createdOptions = tags.map(tag => ({ key: tag.tag_id, text: tag.tagname, value: tag.tag_id }))

  return (
    <Modal
      closeOnEscape={false}
      onClose={() => setModalOpen(false)}
      open={modalOpen}
      size="small"
      trigger={
        <Button color="blue" disabled={!tags.length} onClick={() => setModalOpen(true)} size="small">
          Add tags to students
        </Button>
      }
    >
      <Modal.Content>
        <Form>
          <h2> Add tags to students </h2>
          <Message content={error} hidden={!error} negative />
          <Form.Field>
            <em> Select a tag </em>
            <Dropdown
              onChange={handleChange}
              options={createdOptions}
              placeholder="Tag"
              search
              selectOnBlur={false}
              selectOnNavigation={false}
              selection
              value={selectedValue}
            />
            <em> Insert studentnumbers you wish to add tags to </em>
            <TextArea onChange={event => setInput(event.target.value)} placeholder="011111111" value={input} />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button negative onClick={() => setModalOpen(false)}>
          Cancel
        </Button>
        <Button
          disabled={pending || selectedValue.length === 0 || !input.match(/[^\s,]+/g)}
          onClick={event => handleClick(event)}
          positive
        >
          Add tags
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

TagModal.defaultProps = {
  error: null,
}

TagModal.propTypes = {
  createMultipleStudentTag: func.isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studytrack: string.isRequired,
  combinedProgramme: string.isRequired,
  pending: bool.isRequired,
  success: bool.isRequired,
  error: string,
}

const mapStateToProps = ({ tagstudent }) => ({
  pending: tagstudent.pending,
  success: tagstudent.success,
  error: tagstudent.error,
})

export const ConnectedTagModal = connect(mapStateToProps, { createMultipleStudentTag: createMultipleStudentTagAction })(
  TagModal
)
