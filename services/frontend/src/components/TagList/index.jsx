import { memo } from 'react'
import { Table } from 'semantic-ui-react'

import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { TagStudent } from '@/components/TagStudent'

const Row = memo(
  ({ studentTags, studentNumber, studyTrack, tagOptions, name, combinedProgramme }) => (
    <TagStudent
      combinedProgramme={combinedProgramme}
      studentName={name}
      studentNumber={studentNumber}
      studentTags={studentTags}
      studyTrack={studyTrack}
      tagOptions={tagOptions}
    />
  ),
  (prevProps, newProps) => prevProps.studentTags.length === newProps.studentTags.length
)

export const TagList = ({ combinedProgramme, mainProgramme, selectedStudents, tags }) => {
  const { visible: namesVisible } = useStudentNameVisibility()
  const tagStudents = selectedStudents
    .filter(student => student.tags.length)
    .flatMap(student =>
      student.tags.map(tag => ({
        studentNumber: student.studentNumber,
        tagId: tag.tag_id,
        tag: {
          id: tag.tag.tag_id,
          name: tag.tag.tagname,
          personalUserId: tag.tag.personal_user_id,
        },
      }))
    )

  const tagRows =
    tagStudents && tags
      ? selectedStudents.map(({ studentNumber, name }) => {
          const studentTags = tagStudents.filter(tag => tag.studentNumber === studentNumber)
          const tagIds = studentTags.map(tag => tag.tag.id)
          const studentTagOptions = tags
            .filter(tag => !tagIds?.includes(tag.id))
            .map(tag => ({
              key: tag.id,
              text: tag.name,
              value: tag.id,
            }))
          return (
            <Row
              combinedProgramme={combinedProgramme}
              key={studentNumber}
              name={name}
              studentNumber={studentNumber}
              studentTags={studentTags}
              studyTrack={mainProgramme}
              tagOptions={studentTagOptions}
            />
          )
        })
      : null

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          {namesVisible && <Table.HeaderCell>Student name</Table.HeaderCell>}
          <Table.HeaderCell>Student number</Table.HeaderCell>
          <Table.HeaderCell>Tags</Table.HeaderCell>
          <Table.HeaderCell>Add tags</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{tagRows}</Table.Body>
    </Table>
  )
}
