import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dropdown, List, Label, Icon } from 'semantic-ui-react'
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
  const [allTags, setTags] = useState([])
  const [studentsTagIds, setStudentsTagIds] = useState([])
  const [tagOptions, setTagOptions] = useState([])

  useEffect(() => {
    setTags(tags)
    const tagIds = studentstags.map(t => ({ id: t.id, tag_id: t.tag.tag_id }))
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
      setStudentsTagIds(studentData)
      setTagOptions(filteredData)
    }
  }, [success])

  const handleChange = async (event, { value }) => {
    event.preventDefault()
    const tag = {
      tag_id: value,
      studentnumber
    }
    await createStudentTag(tag)
    getStudentTagsByStudytrack(studytrack)
  }

  const deleteTag = async (event, tag) => {
    event.preventDefault()
    const removableTag = studentsTagIds.find(t => t.tag_id === tag.tag_id)
    await deleteStudentTag(removableTag.id)
    getStudentTagsByStudytrack(studytrack)
  }

  const studentsTags = allTags
    .filter(tag => studentsTagIds.map(t => t.tag_id).includes(tag.tag_id))
    .map(tag => (
      <List.Item key={tag.tag_id} >
        <List.Content>
          <Label>
            {tag.tagname} <Icon name="delete" link onClick={event => deleteTag(event, tag)} />
          </Label>
        </List.Content>
      </List.Item>))

  return (
    <List horizontal>
      <List.Item >
        <List.Content>
          {studentnumber}
        </List.Content>
      </List.Item>
      {studentsTags}
      <List.Item>
        <List.Content>
          <Dropdown
            placeholder="Tag"
            search
            selection
            options={tagOptions}
            onChange={handleChange}
          />
        </List.Content>
      </List.Item>
    </List>
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
