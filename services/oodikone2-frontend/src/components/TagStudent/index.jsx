import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dropdown } from 'semantic-ui-react'
import { arrayOf, string, shape, func, number } from 'prop-types'

import { createStudentTagAction, getStudentTagsByStudentnumberAction, deleteStudentTagAction } from '../../redux/tagstudent'

const TagStudent = ({ createStudentTag, deleteStudentTag, studentnumber, studentstags, tags, getStudentTagsByStudentnumber }) => {
  const [tagId, setTagId] = useState('')
  const [selectedValue, setValue] = useState('')
  const [allTags, setTags] = useState([])
  const [studentsTagIds, setStudentsTagIds] = useState([])
  const [tagOptions, setTagOptions] = useState([])

  useEffect(() => {
    setTags(tags)
    const tagIds = studentstags.map(t => t.tag.tag_id)
    setStudentsTagIds(tagIds)
    const initialTagOptions = tags.filter(tag => !tagIds.includes(tag.tag_id)).map(tag => ({
      key: tag.tag_id,
      text: tag.tagname,
      value: tag.tag_id
    }))
    setTagOptions(initialTagOptions)
  }, [])



  const handleChange = (event, { value }) => {
    event.preventDefault()
    setValue(value)
    setTagId(value)
  }

  const deleteTag = (event, { value }) => {
    event.preventDefault()
    const tag = {
      tag_id: value,
      studentnumber
    }
    deleteStudentTag(tag)
    const newTagIds = studentsTagIds.filter(id => id !== value)
    setStudentsTagIds(newTagIds)
    const newTagOptions = allTags.filter(t => !studentsTagIds.includes(t.tag_id)).map(t => ({
      key: t.tag_id,
      text: t.tagname,
      value: t.tag_id
    }))
    setTagOptions(newTagOptions)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const tag = {
      tag_id: Number(tagId),
      studentnumber
    }
    createStudentTag(tag)
    setTagId('')
    setValue('')
    getStudentTagsByStudentnumber(studentnumber)
    const newTagIds = studentsTagIds.concat(tag.tag_id.toString())
    setStudentsTagIds(newTagIds)
    const newTagOptions = allTags.filter(t => !newTagIds.includes(t.tag_id)).map(t => ({
      key: t.tag_id,
      text: t.tagname,
      value: t.tag_id
    }))
    setTagOptions(newTagOptions)
  }

  const studentsTags = allTags.filter(tag => studentsTagIds.includes(tag.tag_id)).map(tag => <Button key={tag.tag_id} onClick={deleteTag} value={tag.tag_id}>{tag.tagname} delete</Button>)

  return (
    <div>
      {studentnumber}
      {studentsTags}
      <Dropdown
        placeholder="Tag"
        search
        selection
        options={tagOptions}
        onChange={handleChange}
        value={selectedValue}
      />
      <Button onClick={handleSubmit}>slam dunk tag to student</Button>
    </div>
  )
}

TagStudent.propTypes = {
  createStudentTag: func.isRequired,
  getStudentTagsByStudentnumber: func.isRequired,
  deleteStudentTag: func.isRequired,
  studentnumber: string.isRequired,
  studentstags: arrayOf(shape({ tag: { tagname: string, tag_id: string }, id: number })).isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired
}

export default withRouter(connect(null, {
  createStudentTag: createStudentTagAction,
  getStudentTagsByStudentnumber: getStudentTagsByStudentnumberAction,
  deleteStudentTag: deleteStudentTagAction
})(TagStudent))
