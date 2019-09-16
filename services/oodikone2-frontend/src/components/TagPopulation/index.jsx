import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Button, Dropdown, List } from 'semantic-ui-react'
import { arrayOf, string, shape, func } from 'prop-types'

import { createMultipleStudentTagAction } from '../../redux/tagstudent'

const TagPopulation = ({ createMultipleStudentTag, tags, studytrack, selectedStudents }) => {
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

  const handleSubmit = event => {
    event.preventDefault()
    const tagList = []
    selectedStudents.forEach(sn => {
      const tag = {
        tag_id: selectedValue,
        studentnumber: sn
      }
      tagList.push(tag)
    })
    setSelected('')
    createMultipleStudentTag(tagList, studytrack)
  }

  return (
    <List horizontal>
      <List.Item>
        <Dropdown
          placeholder="Tag"
          search
          selection
          options={options}
          onChange={handleChange}
          value={selectedValue}
          selectOnBlur={false}
          selectOnNavigation={false}
        />
      </List.Item>
      <Button onClick={handleSubmit} disabled={selectedValue === ''}>
        add tag to {selectedStudents.length} students
      </Button>
    </List>
  )
}

TagPopulation.propTypes = {
  createMultipleStudentTag: func.isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  studytrack: string.isRequired,
  selectedStudents: arrayOf(string).isRequired
}

const mapStateToProps = ({ tagstudent }) => ({
  created: tagstudent.created
})

export default withRouter(
  connect(
    mapStateToProps,
    {
      createMultipleStudentTag: createMultipleStudentTagAction
    }
  )(TagPopulation)
)
