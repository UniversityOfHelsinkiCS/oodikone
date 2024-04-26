import { arrayOf, bool, shape, string } from 'prop-types'
import React, { memo } from 'react'
import { connect } from 'react-redux'
import { Table } from 'semantic-ui-react'

import { ConnectedTagStudent as TagStudent } from '@/components/TagStudent'
import { useGetStudentTagsByStudyTrackQuery, useGetTagsByStudyTrackQuery } from '@/redux/tags'
import { makePopulationsToData } from '@/selectors/populationDetails'

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

Row.propTypes = {
  studentsTags: arrayOf(shape({})).isRequired,
  studentNumber: string.isRequired,
  studytrack: string.isRequired,
  tagOptions: arrayOf(shape({})).isRequired,
  name: string.isRequired,
  combinedProgramme: string.isRequired,
}

const TagList = ({ combinedProgramme, mainProgramme, namesVisible, selectedStudents }) => {
  const correctCode = combinedProgramme ? `${mainProgramme}+${combinedProgramme}` : mainProgramme
  const { data: tags } = useGetTagsByStudyTrackQuery(correctCode, { skip: !correctCode })
  const { data: tagstudent } = useGetStudentTagsByStudyTrackQuery(correctCode, { skip: !correctCode })

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

const mapStateToProps = state => {
  const { settings } = state
  const { programme } = makePopulationsToData(state)
  return {
    studytrack: programme,
    namesVisible: settings.namesVisible,
  }
}

TagList.propTypes = {
  selectedStudents: arrayOf(shape({})).isRequired,
  mainProgramme: string.isRequired,
  namesVisible: bool.isRequired,
  combinedProgramme: string.isRequired,
}

export const ConnectedTagList = connect(mapStateToProps)(TagList)
