import { useEffect, useState } from 'react'
import { Button, Confirm, Dropdown, List } from 'semantic-ui-react'

import { useCreateStudentTagsMutation, useDeleteStudentTagsMutation } from '@/redux/tags'

export const TagPopulation = ({ combinedProgramme, mainProgramme, selectedStudents, tags }) => {
  const [options, setOptions] = useState([])
  const [selectedValue, setSelected] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [confirmAdd, setConfirmAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [createStudentTags] = useCreateStudentTagsMutation()
  const [deleteStudentTags] = useDeleteStudentTagsMutation()

  useEffect(() => {
    const createdOptions = tags.map(tag => ({ key: tag.id, text: tag.name, value: tag.id }))
    setOptions(createdOptions)
  }, [])

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setSelected(value)
    const foundTag = tags.find(tag => tag.id === value)
    setSelectedTag(foundTag)
  }

  const handleDelete = () => {
    deleteStudentTags({
      combinedProgramme,
      tagId: selectedValue,
      studentNumbers: selectedStudents,
      studyTrack: mainProgramme,
    })
    setSelected('')
    setConfirmDelete(false)
  }

  const handleAdd = () => {
    const tagList = []
    selectedStudents.forEach(studentNumber => {
      tagList.push({
        studentNumber,
        tagId: selectedValue,
      })
    })
    setSelected('')
    createStudentTags({ combinedProgramme, studyTrack: mainProgramme, studentTags: tagList })
    setConfirmAdd(false)
  }

  const addConfirm = (
    <Confirm
      cancelButton="Cancel"
      confirmButton="Confirm"
      content={`Are you sure you want to add tag "${selectedTag ? selectedTag.name : null}" to ${selectedStudents.length} students?`}
      onCancel={() => setConfirmAdd(false)}
      onConfirm={() => handleAdd()}
      open={confirmAdd && !!selectedTag}
    />
  )

  const deleteConfirm = (
    <Confirm
      cancelButton="Cancel"
      confirmButton="Confirm"
      content={`Are you sure you want to delete tag "${selectedTag ? selectedTag.name : null}" from ${selectedStudents.length} students?`}
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
