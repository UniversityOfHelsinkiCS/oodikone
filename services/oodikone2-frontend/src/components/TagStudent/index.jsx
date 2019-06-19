import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dropdown, List } from 'semantic-ui-react'
import { arrayOf, string, shape, func, bool } from 'prop-types'

import {
  createStudentTagAction,
  deleteStudentTagAction,
  getStudentTagsByStudytrackAction
} from '../../redux/tagstudent'

const TagStudent = ({
  createStudentTag,
  deleteStudentTag,
  getStudentTagsByStudytrack,
  studentnumber,
  studentstags,
  tags,
  studytrack,
  success,
  data }) => {
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

  useEffect(() => {
    if (success) {
      const studentData = data.filter(row => row.studentnumber === studentnumber)
      const newTagIds = studentData.map(t => t.tag_id)
      const filteredData = allTags.filter(tag => !newTagIds.includes(tag.tag_id)).map(tag => ({
        key: tag.tag_id,
        text: tag.tagname,
        value: tag.tag_id
      }))
      setStudentsTagIds(newTagIds)
      setTagOptions(filteredData)
    }
  }, [success])

  const handleChange = ({ value }) => {
    setValue(value)
    setTagId(value)
  }

  const deleteTag = async (event, { value }) => {
    event.preventDefault()
    const tag = {
      tag_id: value,
      studentnumber
    }
    await deleteStudentTag(tag)
    getStudentTagsByStudytrack(studytrack)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const tag = {
      tag_id: tagId,
      studentnumber
    }
    await createStudentTag(tag)
    setTagId('')
    setValue('')
    getStudentTagsByStudytrack(studytrack)
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
  deleteStudentTag: func.isRequired,
  getStudentTagsByStudytrack: func.isRequired,
  studentnumber: string.isRequired,
  studentstags: arrayOf(shape({ tag: shape({ tagname: string, tag_id: string }), id: string })).isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studytrack: string.isRequired,
  success: bool.isRequired,
  data: arrayOf(shape({ studentnumber: string, tag_id: string })).isRequired
}

const mapStateToProps = ({ tagstudent }) => ({
  success: tagstudent.success,
  data: tagstudent.data
})

export default withRouter(connect(mapStateToProps, {
  createStudentTag: createStudentTagAction,
  deleteStudentTag: deleteStudentTagAction,
  getStudentTagsByStudytrack: getStudentTagsByStudytrackAction
})(TagStudent))
