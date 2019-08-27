import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Header, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'

import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import { refreshFilters } from '../../redux/populationFilters'
import { getCustomPopulationCoursesByStudentnumbers } from '../../redux/populationCourses'

const CustomPopulationCourses = ({
  refreshNeeded,
  dispatchRefreshFilters,
  translate,
  courses,
  pending,
  selectedStudents,
  getCustomPopulationCoursesByStudentnumbersDispatch,
  query
}) => {
  const reloadCourses = () => {
    dispatchRefreshFilters()
    getCustomPopulationCoursesByStudentnumbersDispatch({ studentnumberlist: selectedStudents })
  }


  useEffect(() => {
    if (refreshNeeded) {
      reloadCourses()
    }
  }, [refreshNeeded])

  return (
    <Segment>
      <Header size="medium" dividing >
        <Popup
          trigger={<Header.Content>{translate('populationCourses.header')}</Header.Content>}
          content="Sort by clicking columns. Click course name to limit observed population to students who participated to the course."
          wide
          position="top left"
        />
      </Header>
      <SegmentDimmer translate={translate} isLoading={pending} />
      <PopulationCourseStats
        courses={courses}
        query={query}
        pending={pending}
        selectedStudents={selectedStudents}
      />
    </Segment>
  )
}

CustomPopulationCourses.propTypes = {
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  refreshNeeded: bool.isRequired,
  getCustomPopulationCoursesByStudentnumbersDispatch: func.isRequired,
  dispatchRefreshFilters: func.isRequired,
  query: shape({}).isRequired
}

const mapStateToProps = ({ localize, populationFilters, populationCourses }) => ({
  courses: populationCourses.data,
  pending: populationCourses.pending,
  translate: getTranslate(localize),
  query: populationCourses.query,
  refreshNeeded: populationFilters.refreshNeeded
})

export default connect(mapStateToProps, {
  dispatchRefreshFilters: refreshFilters,
  getCustomPopulationCoursesByStudentnumbersDispatch: getCustomPopulationCoursesByStudentnumbers
})(CustomPopulationCourses)
