import { arrayOf, string, shape } from 'prop-types'
import React from 'react'
import { Dropdown, Icon, Label, Table } from 'semantic-ui-react'

import { useDeleteStudentTagsMutation, useCreateStudentTagsMutation } from '@/redux/tags'
import { useStudentNameVisibility } from '../StudentNameVisibilityToggle'

export const TagStudent = ({ studentnumber, studentstags, studytrack, tagOptions, studentname, combinedProgramme }) => {
  const [deleteStudentTags] = useDeleteStudentTagsMutation()
  const [createStudentTags] = useCreateStudentTagsMutation()

  const { visible: namesVisible } = useStudentNameVisibility()
  const handleChange = (event, { value }) => {
    event.preventDefault()
    createStudentTags({
      tags: [{ tag_id: value, studentnumber }],
      studytrack,
      combinedProgramme,
    })
  }

  const deleteTag = (event, tag) => {
    deleteStudentTags({ tagId: tag.tag_id, studentnumbers: [studentnumber], studytrack, combinedProgramme })
  }

  const studentsTags = studentstags.map(t => (
    <Label color={t.tag.personal_user_id ? 'purple' : null} key={`${studentnumber}-${t.tag.tag_id}`}>
      {t.tag.tagname} <Icon link name="delete" onClick={event => deleteTag(event, t.tag)} />
    </Label>
  ))

  return (
    <Table.Row>
      {namesVisible && <Table.Cell>{studentname}</Table.Cell>}
      <Table.Cell>{studentnumber}</Table.Cell>
      <Table.Cell>{studentsTags}</Table.Cell>
      <Table.Cell>
        <Dropdown
          onChange={handleChange}
          options={tagOptions}
          placeholder="Tag"
          search
          selectOnBlur={false}
          selectOnNavigation={false}
          selection
        />
      </Table.Cell>
    </Table.Row>
  )
}

TagStudent.propTypes = {
  studentnumber: string.isRequired,
  studentname: string.isRequired,
  studentstags: arrayOf(shape({ tag: shape({ tagname: string, tag_id: string }), id: string })).isRequired,
  studytrack: string.isRequired,
  tagOptions: arrayOf(shape({})).isRequired,
  combinedProgramme: string.isRequired,
}
