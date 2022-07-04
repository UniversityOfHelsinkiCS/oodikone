import React, { useCallback, useEffect } from 'react'
import { connect } from 'react-redux'
import { withRouter, useHistory } from 'react-router-dom'
import { Segment, Header } from 'semantic-ui-react'
import { getFaculties } from 'redux/faculties'
import { getTextIn } from 'common'
import { useTitle } from '../../common/hooks'
import FacultySelector from './facultySelector'
import useLanguage from '../LanguagePicker/useLanguage'

const FacultyStatistics = props => {
  useTitle('Faculties')
  const history = useHistory()
  const { language } = useLanguage()
  const { match, faculties, getFaculties } = props
  const { facultyCode } = match.params
  const faculty = facultyCode && faculties.find(f => f.code === facultyCode)
  const facultyName = faculty && getTextIn(faculty.name, language)

  useEffect(() => {
    if (faculties.length === 0) getFaculties()
  }, [])

  const handleSelect = useCallback(
    faculty => {
      history.push(`/faculties/${faculty}`, { selected: faculty })
    },
    [history]
  )

  if (!facultyCode)
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Faculty statistics
        </Header>
        <Segment className="contentSegment">
          <FacultySelector faculties={faculties} selected={facultyCode !== undefined} handleSelect={handleSelect} />
        </Segment>
      </div>
    )

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{facultyName}</Header>
          <span>{facultyCode}</span>
        </div>
      </Segment>
    </div>
  )
}

const mapStateToProps = state => ({
  faculties: state.faculties.data,
})

export default connect(mapStateToProps, { getFaculties })(withRouter(FacultyStatistics))
