import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dropdown, Checkbox, List } from 'semantic-ui-react'
import { arrayOf, string, shape, func, bool } from 'prop-types'

import {
  createStudentTagAction,
  getStudentTagsByStudytrackAction
} from '../../redux/tagstudent'

const TagPopulation = ({
  allChecker,
  handleAllCheck,
  falsifyChecks,
  createStudentTag,
  tags,
  checkedStudents,
  getStudentTagsByStudytrack,
  studytrack,
  created }) => {
  const [options, setOptions] = useState([])
  const [selectedValue, setSelected] = useState('')

  useEffect(() => {
    const createdOptions = tags.map(tag => ({ key: tag.tag_id, text: tag.tagname, value: tag.tag_id }))
    setOptions(createdOptions)
  }, [])

  useEffect(() => {
    if (created) {
      getStudentTagsByStudytrack(studytrack)
    }
  }, [created])

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setSelected(value)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    falsifyChecks()
    checkedStudents.forEach((student) => {
      if (student.checked) {
        const tag = {
          tag_id: selectedValue,
          studentnumber: student.studentnumber
        }
        createStudentTag(tag)
        setSelected('')
      }
    })
  }

  return (
    <List horizontal>
      <List.Item>
        <Checkbox
          checked={allChecker}
          onChange={handleAllCheck}
        />
      </List.Item>
      <List.Item>
        <Dropdown
          placeholder="Tag"
          search
          selection
          options={options}
          onChange={handleChange}
          value={selectedValue}
        />
      </List.Item>
      <Button onClick={handleSubmit}>add tag to multiple students</Button>
    </List>
  )
}

TagPopulation.propTypes = {
  createStudentTag: func.isRequired,
  getStudentTagsByStudytrack: func.isRequired,
  checkedStudents: arrayOf(shape({ studentnumber: string, checked: bool })).isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studytrack: string.isRequired,
  created: bool.isRequired,
  falsifyChecks: func.isRequired,
  allChecker: bool.isRequired,
  handleAllCheck: func.isRequired
}

const mapStateToProps = ({ tagstudent }) => ({
  created: tagstudent.created
})

export default withRouter(connect(mapStateToProps, { createStudentTag: createStudentTagAction, getStudentTagsByStudytrack: getStudentTagsByStudytrackAction })(TagPopulation))
