import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import { useState } from 'react'

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
        studentTags: selectedTags.map(({ id }) => ({ studentNumber, tagId: id })),
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
      color={studentTag.tag.personalUserId ? 'secondary' : 'primary'}
      key={`${studentNumber}-${studentTag.tag.id}`}
      label={studentTag.tag.name}
      onDelete={() => deleteTag(studentTag.tag)}
      variant="outlined"
    />
  ))

  return (
    <TableRow>
      {namesVisible ? <TableCell>{studentName}</TableCell> : null}
      <TableCell>{studentNumber}</TableCell>
      <TableCell>{studentTagLabels}</TableCell>
      <TableCell>
        <Stack flexDirection="row" gap={0.5} sx={{ maxWidth: '50%' }}>
          <Autocomplete
            clearOnEscape
            data-cy={'$tagstudent-selector'}
            getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.name)}
            multiple
            onChange={(_, value) => setSelectedTags(value)}
            options={tagOptions}
            renderInput={params => <TextField {...params} label="Select new tags" />}
            size="small"
            sx={{ width: '300px' }}
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
        </Stack>
      </TableCell>
    </TableRow>
  )
}
