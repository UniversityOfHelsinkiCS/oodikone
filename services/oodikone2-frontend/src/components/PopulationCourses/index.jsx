import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Header, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'

import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import { getPopulationSelectedStudentCourses } from '../../redux/populationSelectedStudentCourses'
import { refreshFilters } from '../../redux/populationFilters'

const PopulationCourses = ({
  populationSelectedStudentCourses,
  populationCourses,
  refreshNeeded,
  dispatchRefreshFilters,
  selectedStudents,
  translate,
  getPopulationSelectedStudentCourses: gpc
}) => {
  const selectedPopulationCourses = populationSelectedStudentCourses.data ? populationSelectedStudentCourses : populationCourses

  const { CoursesOf } = infotooltips.PopulationStatistics
  const { pending } = selectedPopulationCourses
  const reloadCourses = () => {
    dispatchRefreshFilters()
    gpc({ ...selectedPopulationCourses.query, uuid: uuidv4(), selectedStudents })
  }

  useEffect(() => {
    if (refreshNeeded) {
      reloadCourses()
    }
  }, [refreshNeeded])

  return (
    <React.Fragment>
      <Segment>
        <Header size="medium" dividing >
          <Popup
            trigger={<Header.Content>{translate('populationCourses.header')}</Header.Content>}
            content="Sort by clicking columns. Click course name to limit observed population to students who
            participated to the course."
            wide
            position="top left"
          />
          <InfoBox content={CoursesOf} />
        </Header>
        <SegmentDimmer translate={translate} isLoading={pending} />
        <PopulationCourseStats
          key={selectedPopulationCourses.query.uuid}
          courses={selectedPopulationCourses.data}
          query={selectedPopulationCourses.query}
          pending={pending}
          selectedStudents={selectedStudents}
        />
      </Segment>
    </React.Fragment>
  )
}

PopulationCourses.propTypes = {
  populationSelectedStudentCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  populationCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  refreshNeeded: bool.isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  getPopulationSelectedStudentCourses: func.isRequired,
  dispatchRefreshFilters: func.isRequired
}

const mapStateToProps = ({ populationSelectedStudentCourses, populationCourses, localize, populationFilters }) => ({
  populationCourses,
  populationSelectedStudentCourses,
  refreshNeeded: populationFilters.refreshNeeded,
  translate: getTranslate(localize)
})

export default connect(mapStateToProps, {
  getPopulationSelectedStudentCourses, dispatchRefreshFilters: refreshFilters
})(PopulationCourses)
