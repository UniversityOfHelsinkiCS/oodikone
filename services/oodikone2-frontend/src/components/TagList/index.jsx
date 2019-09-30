import React, { memo, useEffect } from 'react'
import { connect } from 'react-redux'
import { Table } from 'semantic-ui-react'
import { func, string, arrayOf, shape, bool } from 'prop-types'

import TagStudent from '../TagStudent'
import selector from '../../selectors/populationDetails'
import { getTagsByStudytrackAction } from '../../redux/tags'
import { getStudentTagsByStudytrackAction } from '../../redux/tagstudent'

const Row = memo(
  ({ studentsTags, sn, studytrack, tagOptions, name }) => (
    <TagStudent
      studentnumber={sn}
      studentname={name}
      studentstags={studentsTags}
      studytrack={studytrack}
      tagOptions={tagOptions}
    />
  ),
  (prevProps, newProps) => prevProps.studentsTags.length === newProps.studentsTags.length
)

Row.propTypes = {
  studentsTags: arrayOf(shape({})).isRequired,
  sn: string.isRequired,
  studytrack: string.isRequired,
  tagOptions: arrayOf(shape({})).isRequired,
  name: string.isRequired
}

const TagList = ({
  selectedStudents,
  tagstudent,
  tags,
  studytrack,
  getStudentTagsStudyTrack,
  getTagsByStudytrack,
  namesVisible
}) => {
  useEffect(() => {
    getTagsByStudytrack(studytrack)
    getStudentTagsStudyTrack(studytrack)
  }, [])

  const tagRows = selectedStudents.map(({ studentNumber: sn, name }) => {
    const studentsTags = tagstudent.filter(tag => tag.studentnumber === sn)
    const tagIds = studentsTags.map(t => t.tag.tag_id)
    const studentTagOptions = tags
      .filter(tag => !tagIds.includes(tag.tag_id))
      .map(tag => ({
        key: tag.tag_id,
        text: tag.tagname,
        value: tag.tag_id
      }))
    return (
      <Row
        key={sn}
        tags={tags}
        studentsTags={studentsTags}
        sn={sn}
        name={name}
        studytrack={studytrack}
        tagOptions={studentTagOptions}
      />
    )
  })

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          {namesVisible && <Table.HeaderCell>student name</Table.HeaderCell>}
          <Table.HeaderCell>studentnumber</Table.HeaderCell>
          <Table.HeaderCell>tags</Table.HeaderCell>
          <Table.HeaderCell>add tags</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{tagRows}</Table.Body>
    </Table>
  )
}

const mapStateToProps = state => {
  const { tagstudent, tags } = state
  const { settings } = state
  const { programme } = selector.makePopulationsToData(state)
  return {
    tagstudent: tagstudent.data,
    tags: tags.data,
    studytrack: programme,
    namesVisible: settings.namesVisible
  }
}

TagList.propTypes = {
  getTagsByStudytrack: func.isRequired,
  getStudentTagsStudyTrack: func.isRequired,
  selectedStudents: arrayOf(shape({})).isRequired,
  tags: arrayOf(shape({})).isRequired,
  studytrack: string.isRequired,
  tagstudent: arrayOf(shape({})).isRequired,
  namesVisible: bool.isRequired
}

export default connect(
  mapStateToProps,
  {
    getTagsByStudytrack: getTagsByStudytrackAction,
    getStudentTagsStudyTrack: getStudentTagsByStudytrackAction
  }
)(TagList)
