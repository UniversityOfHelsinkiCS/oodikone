import { useEffect, useState } from 'react'
import { Button, Dropdown, Form, Message, Modal, TextArea } from 'semantic-ui-react'

import { useCreateStudentTagsMutation } from '@/redux/tags'

export const TagModal = ({ combinedProgramme, studytrack, tags }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')
  const [selectedValue, setSelected] = useState('')
  const [createStudentTags, { isError, isLoading, isSuccess }] = useCreateStudentTagsMutation()

  useEffect(() => {
    if (!isLoading) {
      if (isSuccess) {
        setModalOpen(false)
        setSelected('')
        setInput('')
      }
    }
  }, [isLoading])

  const handleClick = async event => {
    event.preventDefault()
    const studentnumbers = input.match(/[^\s,]+/g)
    await createStudentTags({
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
          content="Add a tag to students"
          disabled={!tags.length}
          onClick={() => setModalOpen(true)}
          size="small"
        />
      }
    >
      <Modal.Content>
        <Form>
          <h2>Add a tag to students</h2>
          <Message content="Adding tags to students failed." hidden={!isError} negative />
          <Form.Field>
            <label>Select a tag to add</label>
            <Dropdown
              onChange={handleChange}
              options={createdOptions}
              search
              selectOnBlur={false}
              selectOnNavigation={false}
              selection
              value={selectedValue}
            />
          </Form.Field>
          <Form.Field>
            <label>Insert student numbers you wish to add the tag to (use commas to separate)</label>
            <TextArea onChange={event => setInput(event.target.value)} placeholder="011111111" value={input} />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button content="Cancel" negative onClick={() => setModalOpen(false)} />
        <Button
          content="Add tags"
          disabled={isLoading || selectedValue.length === 0 || !input.match(/[^\s,]+/g)}
          onClick={event => handleClick(event)}
          positive
        />
      </Modal.Actions>
    </Modal>
  )
}
