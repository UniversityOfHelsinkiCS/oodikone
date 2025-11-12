import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { StyledTable } from '@/components/common/StyledTable'
import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'

import { TagStudent } from '@/components/TagStudent'

export const TagList = ({ programme, combinedProgramme, selectedStudents, tags }) => {
  const { visible: namesVisible } = useStudentNameVisibility()
  const tagStudents = selectedStudents
    .filter(student => student.tags.length)
    .flatMap(student =>
      student.tags.map(({ tag, tag_id }) => ({
        studentNumber: student.studentNumber,
        tagId: tag_id,
        tag: {
          id: tag.tag_id,
          name: tag.tagname,
          personalUserId: tag.personal_user_id,
        },
      }))
    )

  return (
    <StyledTable showCellBorders>
      <TableHead>
        <TableRow>
          {namesVisible ? <TableCell>Student name</TableCell> : null}
          <TableCell>Student number</TableCell>
          <TableCell>Tags</TableCell>
          <TableCell>Add tags</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tags
          ? selectedStudents.map(({ studentNumber, name }) => {
              const studentTags = tagStudents.filter(tag => tag.studentNumber === studentNumber)
              const studentTagIds = studentTags.map(tag => tag.tag.id)
              const studentTagOptions = tags
                .filter(({ id }) => !studentTagIds.includes(id))
                .map(({ id, name }) => ({ id, name }))
              return (
                <TagStudent
                  combinedProgramme={combinedProgramme}
                  key={studentNumber}
                  studentName={name}
                  studentNumber={studentNumber}
                  studentTags={studentTags}
                  studyTrack={programme}
                  tagOptions={studentTagOptions}
                />
              )
            })
          : null}
      </TableBody>
    </StyledTable>
  )
}
