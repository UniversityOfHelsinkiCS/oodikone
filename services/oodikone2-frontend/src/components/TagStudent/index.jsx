import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dropdown, List } from 'semantic-ui-react'
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
    console.log(event)
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

  const studentsTags = allTags
    .filter(tag => studentsTagIds.includes(tag.tag_id))
    .map(tag => (
      <List.Item key={tag.tag_id} >
        <List.Content>
          <List.Header>
            Tag name
          </List.Header>
          {tag.tagname} <Button name="delete" onClick={deleteTag} value={tag.tag_id}>delete</Button>
        </List.Content>
      </List.Item>))

  return (
    <div>
      <List horizontal>
        <List.Item >
          <List.Content>
            {studentnumber}
          </List.Content>
        </List.Item>)
        {studentsTags}
      </List>
      <Dropdown
        placeholder="Tag"
        search
        selection
        options={tagOptions}
        onChange={handleChange}
        value={selectedValue}
      />
      <Button onClick={handleSubmit}>give tag to student</Button>
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
