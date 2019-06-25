import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dropdown } from 'semantic-ui-react'
import { arrayOf, string, shape, func, bool } from 'prop-types'

import {
  createStudentTagAction,
  getStudentTagsByStudytrackAction
} from '../../redux/tagstudent'


const TagPopulation = ({ createStudentTag, tags, checkedStudents, getStudentTagsByStudytrack, studytrack }) => {
  const [options, setOptions] = useState([])
  const [selectedValue, setSelected] = useState('')

  useEffect(() => {
    const createdOptions = tags.map(tag => ({ key: tag.tag_id, text: tag.tagname, value: tag.tag_id }))
    setOptions(createdOptions)
  }, [])

  const handleChange = (event, { value }) => {
    event.preventDefault()
    setSelected(value)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
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
    getStudentTagsByStudytrack(studytrack)
  }

  return (
    <div>
      <Dropdown
        placeholder="Tag"
        search
        selection
        options={options}
        onChange={handleChange}
        value={selectedValue}
      />
      <Button onClick={handleSubmit}>add tag to multiple students</Button>
    </div>
  )
}

TagPopulation.propTypes = {
  createStudentTag: func.isRequired,
  getStudentTagsByStudytrack: func.isRequired,
  checkedStudents: arrayOf(shape({ studentnumber: string, checked: bool })).isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studytrack: string.isRequired
}


export default withRouter(connect(null, { createStudentTag: createStudentTagAction, getStudentTagsByStudytrack: getStudentTagsByStudytrackAction })(TagPopulation))
