import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dropdown, List, Confirm } from 'semantic-ui-react'
import { arrayOf, string, shape, func } from 'prop-types'

import { createMultipleStudentTagAction, deleteMultipleStudentTagAction } from '../../redux/tagstudent'

const TagPopulation = ({ createMultipleStudentTag, tags, studytrack, selectedStudents, deleteMultipleStudentTag }) => {
  const [options, setOptions] = useState([])
  const [selectedValue, setSelected] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [confirmAdd, setConfirmAdd] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

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
    deleteMultipleStudentTag(selectedValue, selectedStudents, studytrack)
    setSelected('')
    setConfirmDelete(null)
  }

  const handleAdd = () => {
    const tagList = []
    selectedStudents.forEach(sn => {
      const tag = {
        tag_id: selectedValue,
        studentnumber: sn
      }
      tagList.push(tag)
    })
    setSelected('')
    createMultipleStudentTag(tagList, studytrack)
    setConfirmAdd(null)
  }

  const addConfirm = (
    <Confirm
      open={confirmAdd === selectedTag && selectedTag}
      onCancel={() => setConfirmAdd(null)}
      onConfirm={() => handleAdd()}
      content={`Are you sure you want to add tag "${selectedTag ? selectedTag.tagname : null}" to ${
        selectedStudents.length
      } students?`}
      cancelButton="Cancel"
      confirmButton="Confirm"
    />
  )

  const deleteConfirm = (
    <Confirm
      open={confirmDelete === selectedTag && selectedTag}
      onCancel={() => setConfirmDelete(null)}
      onConfirm={() => handleDelete()}
      content={`Are you sure you want to delete tag "${selectedTag ? selectedTag.tagname : null}" from ${
        selectedStudents.length
      } students?`}
      cancelButton="Cancel"
      confirmButton="Confirm"
    />
  )

  return (
    <List horizontal>
      <List.Item>
        <Dropdown
          placeholder="Tag"
          search
          selection
          options={options}
          onChange={handleChange}
          value={selectedValue}
          selectOnBlur={false}
          selectOnNavigation={false}
        />
      </List.Item>
      <Button onClick={() => setConfirmAdd(selectedTag)} disabled={selectedValue === ''}>
        add tag to {selectedStudents.length} students
      </Button>
      <Button onClick={() => setConfirmDelete(selectedTag)} disabled={selectedValue === ''}>
        delete tag from {selectedStudents.length} students
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
  studytrack: string.isRequired,
  selectedStudents: arrayOf(string).isRequired
}

const mapStateToProps = ({ tagstudent }) => ({
  created: tagstudent.created
})

export default withRouter(
  connect(
    mapStateToProps,
    {
      createMultipleStudentTag: createMultipleStudentTagAction,
      deleteMultipleStudentTag: deleteMultipleStudentTagAction
    }
  )(TagPopulation)
)
