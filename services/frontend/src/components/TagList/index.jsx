import { arrayOf, bool, func, shape, string } from 'prop-types'
import React, { memo, useEffect } from 'react'
import { connect } from 'react-redux'
import { Table } from 'semantic-ui-react'

import { ConnectedTagStudent as TagStudent } from '@/components/TagStudent'
import { getTagsByStudytrackAction } from '@/redux/tags'
import { getStudentTagsByStudytrackAction } from '@/redux/tagstudent'
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

const TagList = ({
  combinedProgramme,
  getStudentTagsStudyTrack,
  getTagsByStudytrack,
  mainProgramme,
  namesVisible,
  selectedStudents,
  tags,
  tagstudent,
}) => {
  useEffect(() => {
    const studytrackCode = combinedProgramme ? `${mainProgramme}-${combinedProgramme}` : mainProgramme
    getTagsByStudytrack(studytrackCode)
    getStudentTagsStudyTrack(studytrackCode)
  }, [])

  const tagRows = selectedStudents.map(({ studentNumber, name }) => {
    const studentsTags = tagstudent.filter(tag => tag.studentnumber === studentNumber)
    const tagIds = studentsTags.map(tag => tag.tag.tag_id)
    const studentTagOptions = tags
      .filter(tag => !tagIds.includes(tag.tag_id))
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
        tags={tags}
      />
    )
  })

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
  const { tagstudent, tags } = state
  const { settings } = state
  const { programme } = makePopulationsToData(state)
  return {
    tagstudent: tagstudent.data,
    tags: tags.data,
    studytrack: programme,
    namesVisible: settings.namesVisible,
  }
}

TagList.propTypes = {
  getTagsByStudytrack: func.isRequired,
  getStudentTagsStudyTrack: func.isRequired,
  selectedStudents: arrayOf(shape({})).isRequired,
  tags: arrayOf(shape({})).isRequired,
  mainProgramme: string.isRequired,
  tagstudent: arrayOf(shape({})).isRequired,
  namesVisible: bool.isRequired,
  combinedProgramme: string.isRequired,
}

export const ConnectedTagList = connect(mapStateToProps, {
  getTagsByStudytrack: getTagsByStudytrackAction,
  getStudentTagsStudyTrack: getStudentTagsByStudytrackAction,
})(TagList)
