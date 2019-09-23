import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Dropdown, List, Label, Icon } from 'semantic-ui-react'
import { arrayOf, string, shape, func, bool } from 'prop-types'

import { createStudentTagAction, deleteStudentTagAction } from '../../redux/tagstudent'

const TagStudent = ({
  createStudentTag,
  deleteStudentTag,
  studentnumber,
  studentstags,
  studytrack,
  tagOptions,
  studentname,
  namesVisible
}) => {
  const handleChange = (event, { value }) => {
    event.preventDefault()
    const tag = {
      tag_id: value,
      studentnumber
    }
    createStudentTag(tag, studytrack)
  }

  const deleteTag = (event, tag) => {
    deleteStudentTag(tag.tag_id, studentnumber, studytrack)
  }

  const studentsTags = studentstags.map(t => (
    <List.Item key={`${studentnumber}-${t.tag.tag_id}`}>
      <List.Content>
        <Label>
          {t.tag.tagname} <Icon name="delete" link onClick={event => deleteTag(event, t.tag)} />
        </Label>
      </List.Content>
    </List.Item>
  ))

  return (
    <List horizontal style={{ display: 'flex', alignItems: 'center' }}>
      <List.Item>
        {namesVisible && <List.Content>{studentname}</List.Content>}
        <List.Content>{studentnumber}</List.Content>
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
            selectOnBlur={false}
            selectOnNavigation={false}
          />
        </List.Content>
      </List.Item>
    </List>
  )
}

TagStudent.propTypes = {
  createStudentTag: func.isRequired,
  deleteStudentTag: func.isRequired,
  studentnumber: string.isRequired,
  studentname: string.isRequired,
  studentstags: arrayOf(shape({ tag: shape({ tagname: string, tag_id: string }), id: string })).isRequired,
  studytrack: string.isRequired,
  tagOptions: arrayOf(shape({})).isRequired,
  namesVisible: bool.isRequired
}

const mapStateToProps = ({ settings }) => ({
  namesVisible: settings.namesVisible
})

export default withRouter(
  connect(
    mapStateToProps,
    {
      createStudentTag: createStudentTagAction,
      deleteStudentTag: deleteStudentTagAction
    }
  )(TagStudent)
)
