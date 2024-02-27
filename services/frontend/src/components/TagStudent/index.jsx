import { arrayOf, string, shape, func, bool } from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { Dropdown, Label, Icon, Table } from 'semantic-ui-react'

import { createStudentTagAction, deleteStudentTagAction } from '@/redux/tagstudent'

const TagStudent = ({
  createStudentTag,
  deleteStudentTag,
  studentnumber,
  studentstags,
  studytrack,
  tagOptions,
  studentname,
  namesVisible,
  combinedProgramme,
}) => {
  const handleChange = (event, { value }) => {
    event.preventDefault()
    const tag = {
      tag_id: value,
      studentnumber,
    }
    createStudentTag(tag, studytrack, combinedProgramme)
  }

  const deleteTag = (event, tag) => {
    deleteStudentTag(tag.tag_id, studentnumber, studytrack, combinedProgramme)
  }

  const studentsTags = studentstags.map(t => (
    <Label key={`${studentnumber}-${t.tag.tag_id}`} color={t.tag.personal_user_id ? 'purple' : null}>
      {t.tag.tagname} <Icon name="delete" link onClick={event => deleteTag(event, t.tag)} />
    </Label>
  ))

  return (
    <Table.Row>
      {namesVisible && <Table.Cell>{studentname}</Table.Cell>}
      <Table.Cell>{studentnumber}</Table.Cell>
      <Table.Cell>{studentsTags}</Table.Cell>
      <Table.Cell>
        <Dropdown
          placeholder="Tag"
          search
          selection
          options={tagOptions}
          onChange={handleChange}
          selectOnBlur={false}
          selectOnNavigation={false}
        />
      </Table.Cell>
    </Table.Row>
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
  namesVisible: bool.isRequired,
  combinedProgramme: string.isRequired,
}

const mapStateToProps = ({ settings }) => ({
  namesVisible: settings.namesVisible,
})

export const ConnectedTagStudent = connect(mapStateToProps, {
  createStudentTag: createStudentTagAction,
  deleteStudentTag: deleteStudentTagAction,
})(TagStudent)
