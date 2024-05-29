import { arrayOf, string, shape } from 'prop-types'
import { useState } from 'react'
import { Button, Dropdown, Icon, Label, Table } from 'semantic-ui-react'

import { useDeleteStudentTagsMutation, useCreateStudentTagsMutation } from '@/redux/tags'
import { useStudentNameVisibility } from '../StudentNameVisibilityToggle'

export const TagStudent = ({ studentnumber, studentstags, studytrack, tagOptions, studentname, combinedProgramme }) => {
  const [deleteStudentTags] = useDeleteStudentTagsMutation()
  const [createStudentTags, { isLoading }] = useCreateStudentTagsMutation()
  const { visible: namesVisible } = useStudentNameVisibility()
  const [selectedTags, setSelectedTags] = useState([])

  const handleSave = async () => {
    await createStudentTags({
      tags: selectedTags.map(tag => ({ tag_id: tag, studentnumber })),
      studytrack,
      combinedProgramme,
    })
    setSelectedTags([])
  }

  const deleteTag = tag => {
    deleteStudentTags({ tagId: tag.tag_id, studentnumbers: [studentnumber], studytrack, combinedProgramme })
  }

  const studentsTags = studentstags.map(t => (
    <Label color={t.tag.personal_user_id ? 'purple' : null} key={`${studentnumber}-${t.tag.tag_id}`}>
      {t.tag.tagname} <Icon link name="delete" onClick={() => deleteTag(t.tag)} />
    </Label>
  ))

  return (
    <Table.Row>
      {namesVisible && <Table.Cell>{studentname}</Table.Cell>}
      <Table.Cell>{studentnumber}</Table.Cell>
      <Table.Cell>{studentsTags}</Table.Cell>
      <Table.Cell>
        <div style={{ display: 'flex', gap: '0.5em' }}>
          <Dropdown
            clearable
            multiple
            onChange={(_, { value }) => setSelectedTags(value)}
            options={tagOptions}
            search
            selectOnBlur={false}
            selectOnNavigation={false}
            selection
            value={selectedTags}
          />
          <Button disabled={!selectedTags.length} loading={isLoading} onClick={handleSave} positive>
            Save
          </Button>
        </div>
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
