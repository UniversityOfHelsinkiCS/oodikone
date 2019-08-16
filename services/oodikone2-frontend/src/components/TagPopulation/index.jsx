import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dropdown, Checkbox, List } from 'semantic-ui-react'
import { arrayOf, string, shape, func, bool } from 'prop-types'

import {
  createMultipleStudentTagAction
} from '../../redux/tagstudent'

const TagPopulation = ({
  allChecker,
  handleAllCheck,
  falsifyChecks,
  createMultipleStudentTag,
  tags,
  checkedStudents,
  studytrack }) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    const tagList = []
    checkedStudents.forEach((student) => {
      if (student.checked) {
        const tag = {
          tag_id: selectedValue,
          studentnumber: student.studentnumber
        }
        tagList.push(tag)
      }
    })
    setSelected('')
    falsifyChecks()
    await createMultipleStudentTag(tagList, studytrack)
  }

  const checkCount = checkedStudents.reduce((n, student) => n + (student.checked), 0)

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
      <Button onClick={handleSubmit} disabled={selectedValue === '' || checkCount === 0}>add tag to multiple students</Button>
    </List>
  )
}

TagPopulation.propTypes = {
  createMultipleStudentTag: func.isRequired,
  checkedStudents: arrayOf(shape({ studentnumber: string, checked: bool })).isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studytrack: string.isRequired,
  falsifyChecks: func.isRequired,
  allChecker: bool.isRequired,
  handleAllCheck: func.isRequired
}

const mapStateToProps = ({ tagstudent }) => ({
  created: tagstudent.created
})

export default withRouter(connect(mapStateToProps, {
  createMultipleStudentTag: createMultipleStudentTagAction
})(TagPopulation))
