import { useState } from 'react'
import { Button, Dropdown, Icon, Label, Table } from 'semantic-ui-react'

import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { useDeleteStudentTagsMutation, useCreateStudentTagsMutation } from '@/redux/tags'

export const TagStudent = ({ studentNumber, studentTags, studyTrack, tagOptions, studentName, combinedProgramme }) => {
  const [deleteStudentTags] = useDeleteStudentTagsMutation()
  const [createStudentTags, { isLoading }] = useCreateStudentTagsMutation()
  const { visible: namesVisible } = useStudentNameVisibility()
  const [selectedTags, setSelectedTags] = useState([])

  const handleSave = () => {
    void createStudentTags({
      combinedProgramme,
      studentTags: selectedTags.map(tag => ({ studentNumber, tagId: tag })),
      studyTrack,
    })
    setSelectedTags([])
  }

  const deleteTag = tag => {
    void deleteStudentTags({
      combinedProgramme,
      tagId: tag.id,
      studentNumbers: [studentNumber],
      studyTrack,
    })
  }

  const studentTagLabels = studentTags.map(studentTag => (
    <Label color={studentTag.tag.personalUserId ? 'purple' : null} key={`${studentNumber}-${studentTag.tag.id}`}>
      {studentTag.tag.name} <Icon link name="delete" onClick={() => deleteTag(studentTag.tag)} />
    </Label>
  ))

  return (
    <Table.Row>
      {namesVisible ? <Table.Cell>{studentName}</Table.Cell> : null}
      <Table.Cell>{studentNumber}</Table.Cell>
      <Table.Cell>{studentTagLabels}</Table.Cell>
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
