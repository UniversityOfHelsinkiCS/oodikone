import React, { memo } from 'react'
import { Table } from 'semantic-ui-react'

import { TagStudent } from '@/components/TagStudent'
import { useGetStudentTagsByStudyTrackQuery, useGetTagsByStudyTrackQuery } from '@/redux/tags'
import { useStudentNameVisibility } from '../StudentNameVisibilityToggle'

const Row = memo(
  ({ studentsTags, studentNumber, studytrack, tagOptions, name, combinedProgramme }) => (
    <TagStudent
      combinedProgramme={combinedProgramme}
      studentname={name}
      studentnumber={studentNumber}
      studentstags={studentsTags}
      studytrack={studytrack}
      tagOptions={tagOptions}
    />
  ),
  (prevProps, newProps) => prevProps.studentsTags.length === newProps.studentsTags.length
)

export const TagList = ({ combinedProgramme, mainProgramme, selectedStudents }) => {
  const correctCode = combinedProgramme ? `${mainProgramme}+${combinedProgramme}` : mainProgramme
  const { data: tags } = useGetTagsByStudyTrackQuery(correctCode, { skip: !correctCode })
  const { data: tagstudent } = useGetStudentTagsByStudyTrackQuery(correctCode, { skip: !correctCode })
  const { visible: namesVisible } = useStudentNameVisibility()

  const tagRows =
    tagstudent && tags
      ? selectedStudents.map(({ studentNumber, name }) => {
          const studentsTags = tagstudent.filter(tag => tag.studentnumber === studentNumber)
          const tagIds = studentsTags.map(tag => tag.tag.tag_id)
          const studentTagOptions = tags
            .filter(tag => !tagIds?.includes(tag.tag_id))
            .map(tag => ({
              key: tag.tag_id,
              text: tag.tagname,
              value: tag.tag_id,
            }))
          return (
            <Row
              combinedProgramme={combinedProgramme}
              key={studentNumber}
              name={name}
              studentNumber={studentNumber}
              studentsTags={studentsTags}
              studytrack={mainProgramme}
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
