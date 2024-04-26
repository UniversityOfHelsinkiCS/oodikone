import React, { useEffect, useState } from 'react'
import { Button, Confirm, Dropdown, List } from 'semantic-ui-react'

import { useCreateMultipleStudentTagsMutation, useDeleteMultipleStudentTagsMutation } from '@/redux/tags'

export const TagPopulation = ({ combinedProgramme, mainProgramme, selectedStudents, tags }) => {
  const [options, setOptions] = useState([])
  const [selectedValue, setSelected] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [confirmAdd, setConfirmAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [createMultipleStudentTags] = useCreateMultipleStudentTagsMutation()
  const [deleteMultipleStudentTags] = useDeleteMultipleStudentTagsMutation()

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
    deleteMultipleStudentTags({
      tagId: selectedValue,
      studentnumbers: selectedStudents,
      studytrack: mainProgramme,
      combinedProgramme,
    })
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
    createMultipleStudentTags({ tags: tagList, studytrack: mainProgramme, combinedProgramme })
    setConfirmAdd(false)
  }

  const addConfirm = (
    <Confirm
      cancelButton="Cancel"
      confirmButton="Confirm"
      content={`Are you sure you want to add tag "${selectedTag ? selectedTag.tagname : null}" to ${selectedStudents.length} students?`}
      onCancel={() => setConfirmAdd(false)}
      onConfirm={() => handleAdd()}
      open={confirmAdd && !!selectedTag}
    />
  )

  const deleteConfirm = (
    <Confirm
      cancelButton="Cancel"
      confirmButton="Confirm"
      content={`Are you sure you want to delete tag "${selectedTag ? selectedTag.tagname : null}" from ${selectedStudents.length} students?`}
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
      <Button
        content={`Add tag to ${selectedStudents.length} students`}
        disabled={selectedValue === ''}
        onClick={() => setConfirmAdd(true)}
        style={{ marginLeft: '10px' }}
      />
      <Button
        content={`Delete tag from ${selectedStudents.length} students`}
        disabled={selectedValue === ''}
        onClick={() => setConfirmDelete(true)}
        style={{ marginLeft: '10px' }}
      />
      {deleteConfirm}
      {addConfirm}
    </List>
  )
}
