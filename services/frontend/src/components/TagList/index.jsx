import { memo } from 'react'
import { Table } from 'semantic-ui-react'

import { useStudentNameVisibility } from '@/components/material/StudentNameVisibilityToggle'
import { TagStudent } from '@/components/TagStudent'
import { useGetStudentTagsByStudyTrackQuery, useGetTagsByStudyTrackQuery } from '@/redux/tags'

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

export const TagList = ({ combinedProgramme, mainProgramme, selectedStudents }) => {
  const correctCode = combinedProgramme ? `${mainProgramme}+${combinedProgramme}` : mainProgramme
  const { data: tags } = useGetTagsByStudyTrackQuery(correctCode, { skip: !correctCode })
  const { data: tagStudents } = useGetStudentTagsByStudyTrackQuery(correctCode, { skip: !correctCode })
  const { visible: namesVisible } = useStudentNameVisibility()

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
