import { arrayOf, bool, shape, string } from 'prop-types'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Button, Dropdown, Form, Message, Modal, TextArea } from 'semantic-ui-react'

import { useCreateMultipleStudentTagsMutation } from '@/redux/tags'

const TagModal = ({ combinedProgramme, error, pending, studytrack, success, tags }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')
  const [selectedValue, setSelected] = useState('')
  const [createMultipleStudentTags] = useCreateMultipleStudentTagsMutation()

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
    createMultipleStudentTags({
      tags: studentnumbers.map(studentNumber => ({
        tag_id: selectedValue,
        studentnumber: studentNumber,
      })),
      studytrack,
      combinedProgramme,
    })
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
        <Button
          color="blue"
          content="Add tags to students"
          disabled={!tags.length}
          onClick={() => setModalOpen(true)}
          size="small"
        />
      }
    >
      <Modal.Content>
        <Form>
          <h2>Add tags to students</h2>
          <Message content={error} hidden={!error} negative />
          <Form.Field>
            <em>Select a tag</em>
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
            <em>Insert studentnumbers you wish to add tags to</em>
            <TextArea onChange={event => setInput(event.target.value)} placeholder="011111111" value={input} />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button content="Cancel" negative onClick={() => setModalOpen(false)} />
        <Button
          content="Add tags"
          disabled={pending || selectedValue.length === 0 || !input.match(/[^\s,]+/g)}
          onClick={event => handleClick(event)}
          positive
        />
      </Modal.Actions>
    </Modal>
  )
}

TagModal.defaultProps = {
  error: null,
}

TagModal.propTypes = {
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studytrack: string.isRequired,
  combinedProgramme: string.isRequired,
  pending: bool.isRequired,
  success: bool.isRequired,
  error: string,
}

const mapStateToProps = () => ({
  pending: false,
  success: true,
  error: null,
})

export const ConnectedTagModal = connect(mapStateToProps)(TagModal)
