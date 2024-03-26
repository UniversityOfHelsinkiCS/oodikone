import { arrayOf, func, shape, string } from 'prop-types'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Button, Confirm, Dropdown, List } from 'semantic-ui-react'

import { createMultipleStudentTagAction, deleteMultipleStudentTagAction } from '@/redux/tagstudent'

const TagPopulation = ({
  combinedProgramme,
  createMultipleStudentTag,
  deleteMultipleStudentTag,
  mainProgramme,
  selectedStudents,
  tags,
}) => {
  const [options, setOptions] = useState([])
  const [selectedValue, setSelected] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [confirmAdd, setConfirmAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const createdOptions = tags.map(tag => ({ key: tag.tag_id, text: tag.tagname, value: tag.tag_id }))
    setOptions(createdOptions)
  }, [])

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setSelected(value)
    const foundTag = tags.find(tag => tag.tag_id === value)
    setSelectedTag(foundTag)
  }

  const handleDelete = () => {
    deleteMultipleStudentTag(selectedValue, selectedStudents, mainProgramme, combinedProgramme)
    setSelected('')
    setConfirmDelete(false)
  }

  const handleAdd = () => {
    const tagList = []
    selectedStudents.forEach(studentNumber => {
      const tag = {
        tag_id: selectedValue,
        studentnumber: studentNumber,
      }
      tagList.push(tag)
    })
    setSelected('')
    createMultipleStudentTag(tagList, mainProgramme, combinedProgramme)
    setConfirmAdd(false)
  }

  const addConfirm = (
    <Confirm
      cancelButton="Cancel"
      confirmButton="Confirm"
      content={`Are you sure you want to add tag "${selectedTag ? selectedTag.tagname : null}" to ${
        selectedStudents.length
      } students?`}
      onCancel={() => setConfirmAdd(false)}
      onConfirm={() => handleAdd()}
      open={confirmAdd && !!selectedTag}
    />
  )

  const deleteConfirm = (
    <Confirm
      cancelButton="Cancel"
      confirmButton="Confirm"
      content={`Are you sure you want to delete tag "${selectedTag ? selectedTag.tagname : null}" from ${
        selectedStudents.length
      } students?`}
      onCancel={() => setConfirmDelete(false)}
      onConfirm={() => handleDelete()}
      open={confirmDelete && !!selectedTag}
    />
  )

  return (
    <List horizontal>
      <List.Item>
        <Dropdown
          onChange={handleChange}
          options={options}
          placeholder="Tag"
          search
          selectOnBlur={false}
          selectOnNavigation={false}
          selection
          value={selectedValue}
        />
      </List.Item>
      <Button disabled={selectedValue === ''} onClick={() => setConfirmAdd(true)} style={{ marginLeft: '10px' }}>
        Add tag to {selectedStudents.length} students
      </Button>
      <Button disabled={selectedValue === ''} onClick={() => setConfirmDelete(true)} style={{ marginLeft: '10px' }}>
        Delete tag from {selectedStudents.length} students
      </Button>
      {deleteConfirm}
      {addConfirm}
    </List>
  )
}

TagPopulation.propTypes = {
  createMultipleStudentTag: func.isRequired,
  deleteMultipleStudentTag: func.isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  mainProgramme: string.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  combinedProgramme: string.isRequired,
}

const mapStateToProps = ({ tagstudent }) => ({
  created: tagstudent.created,
})

export const ConnectedTagPopulation = connect(mapStateToProps, {
  createMultipleStudentTag: createMultipleStudentTagAction,
  deleteMultipleStudentTag: deleteMultipleStudentTagAction,
})(TagPopulation)
