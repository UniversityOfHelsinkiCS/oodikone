import { arrayOf, string, shape, func } from 'prop-types'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { Button, Dropdown, List, Confirm } from 'semantic-ui-react'

import { createMultipleStudentTagAction, deleteMultipleStudentTagAction } from '@/redux/tagstudent'

const TagPopulation = ({
  createMultipleStudentTag,
  tags,
  mainProgramme,
  selectedStudents,
  deleteMultipleStudentTag,
  combinedProgramme,
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
    selectedStudents.forEach(sn => {
      const tag = {
        tag_id: selectedValue,
        studentnumber: sn,
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
      <Button disabled={selectedValue === ''} onClick={() => setConfirmAdd(true)}>
        add tag to {selectedStudents.length} students
      </Button>
      <Button disabled={selectedValue === ''} onClick={() => setConfirmDelete(true)}>
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
