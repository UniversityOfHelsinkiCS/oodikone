import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { useState } from 'react'
import { Dropdown } from 'semantic-ui-react'

import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { useDeleteStudentTagsMutation, useCreateStudentTagsMutation } from '@/redux/tags'

export const TagStudent = ({ studentNumber, studentTags, studyTrack, tagOptions, studentName, combinedProgramme }) => {
  const [deleteStudentTags] = useDeleteStudentTagsMutation()
  const [createStudentTags, { isLoading }] = useCreateStudentTagsMutation()
  const { visible: namesVisible } = useStudentNameVisibility()
  const [selectedTags, setSelectedTags] = useState([])

  const handleSave = () => {
    if (selectedTags.length) {
      void createStudentTags({
        combinedProgramme,
        studentTags: selectedTags.map(tag => ({ studentNumber, tagId: tag })),
        studyTrack,
      })
      setSelectedTags([])
    }
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
    <Chip
      color={studentTag.tag.personalUserId ? 'secondary' : 'disabled'}
      key={`${studentNumber}-${studentTag.tag.id}`}
      label={studentTag.tag.name}
      onDelete={() => deleteTag(studentTag.tag)}
      variant="outlined"
    />
  ))

  return (
    <TableRow>
      {namesVisible ? <TableCell>{namesVisible ? studentName : null}</TableCell> : null}
      <TableCell>{studentNumber}</TableCell>
      <TableCell>{studentTagLabels}</TableCell>
      <TableCell>
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
          <Button
            color={!selectedTags.length ? 'primary' : 'success'}
            loading={isLoading}
            onClick={handleSave}
            variant="outlined"
          >
            Save
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
