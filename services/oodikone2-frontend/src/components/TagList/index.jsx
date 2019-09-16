import React, { memo, useEffect } from 'react'
import { connect } from 'react-redux'
import { List } from 'semantic-ui-react'
import { func, string, arrayOf, shape } from 'prop-types'

import TagStudent from '../TagStudent'
import selector from '../../selectors/populationDetails'
import { getTagsByStudytrackAction } from '../../redux/tags'
import { getStudentTagsByStudytrackAction } from '../../redux/tagstudent'

const Row = memo(
  ({ studentsTags, sn, studytrack, tagOptions }) => (
    <div>
      <List horizontal>
        <List.Item></List.Item>
        <List.Item>
          <TagStudent studentnumber={sn} studentstags={studentsTags} studytrack={studytrack} tagOptions={tagOptions} />
        </List.Item>
      </List>
    </div>
  ),
  (prevProps, newProps) => prevProps.studentsTags.length === newProps.studentsTags.length
)

Row.propTypes = {
  studentsTags: arrayOf(shape({})).isRequired,
  sn: string.isRequired,
  studytrack: string.isRequired,
  tagOptions: arrayOf(shape({})).isRequired
}

const TagList = ({ selectedStudents, tagstudent, tags, studytrack, getStudentTagsStudyTrack, getTagsByStudytrack }) => {
  useEffect(() => {
    getTagsByStudytrack(studytrack)
    getStudentTagsStudyTrack(studytrack)
  }, [])

  const tagRows = selectedStudents.map(sn => {
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
        studytrack={studytrack}
        tagOptions={studentTagOptions}
      />
    )
  })

  return tagRows
}

const mapStateToProps = state => {
  const { tagstudent, tags } = state
  const { selectedStudents, programme } = selector.makePopulationsToData(state)
  return {
    tagstudent: tagstudent.data,
    tags: tags.data,
    selectedStudents,
    studytrack: programme
  }
}

TagList.propTypes = {
  getTagsByStudytrack: func.isRequired,
  getStudentTagsStudyTrack: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  tags: arrayOf(shape({})).isRequired,
  studytrack: string.isRequired,
  tagstudent: arrayOf(shape({})).isRequired
}

export default connect(
  mapStateToProps,
  {
    getTagsByStudytrack: getTagsByStudytrackAction,
    getStudentTagsStudyTrack: getStudentTagsByStudytrackAction
  }
)(TagList)
