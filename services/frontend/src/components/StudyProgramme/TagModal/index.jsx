import { arrayOf, string, bool, func, shape } from 'prop-types'
import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Button, Modal, Form, TextArea, Dropdown, Message } from 'semantic-ui-react'

import { createMultipleStudentTagAction } from '@/redux/tagstudent'

const TagModal = ({ tags, studytrack, createMultipleStudentTag, pending, success, error, combinedProgramme }) => {
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
      studentnumbers.map(sn => ({
        tag_id: selectedValue,
        studentnumber: sn,
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
      trigger={
        <Button size="small" disabled={!tags.length} color="blue" onClick={() => setModalOpen(true)}>
          Add tags to students
        </Button>
      }
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      size="small"
      closeOnEscape={false}
    >
      <Modal.Content>
        <Form>
          <h2> Add tags to students </h2>
          <Message hidden={!error} content={error} negative />
          <Form.Field>
            <em> Select a tag </em>
            <Dropdown
              placeholder="Tag"
              search
              selection
              selectOnBlur={false}
              selectOnNavigation={false}
              options={createdOptions}
              onChange={handleChange}
              value={selectedValue}
            />
            <em> Insert studentnumbers you wish to add tags to </em>
            <TextArea placeholder="011111111" onChange={e => setInput(e.target.value)} value={input} />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button negative onClick={() => setModalOpen(false)}>
          Cancel
        </Button>
        <Button
          positive
          onClick={event => handleClick(event)}
          disabled={pending || selectedValue.length === 0 || !input.match(/[^\s,]+/g)}
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
