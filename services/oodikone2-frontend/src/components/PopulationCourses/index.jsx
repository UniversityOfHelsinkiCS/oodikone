import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Header, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'

import SegmentDimmer from '../SegmentDimmer'
import Progressbar from '../Progressbar'
import PopulationCourseStats from '../PopulationCourseStats'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import { getPopulationCourses } from '../../redux/populationCourses'
import { refreshFilters } from '../../redux/populationFilters'

const PopulationCourses = ({
  populationCourses,
  refreshNeeded,
  dispatchRefreshFilters,
  selectedStudents,
  translate,
  getPopulationCourses: gpc
}) => {
  const { CoursesOf } = infotooltips.PopulationStatistics
  const { pending } = populationCourses
  const reloadCourses = () => {
    dispatchRefreshFilters()
    gpc({ ...populationCourses.query, uuid: uuidv4(), selectedStudents })
  }

  useEffect(() => {
    if (refreshNeeded) {
      reloadCourses()
    }
  }, [refreshNeeded])

  return (
    <React.Fragment>
      <Progressbar time={140} pending={pending} />
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
          key={populationCourses.query.uuid}
          courses={populationCourses.data}
          query={populationCourses.query}
          pending={populationCourses.pending}
          selectedStudents={selectedStudents}
        />
      </Segment>
    </React.Fragment>
  )
}

PopulationCourses.propTypes = {
  populationCourses: shape({}).isRequired,
  refreshNeeded: bool.isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  getPopulationCourses: func.isRequired,
  dispatchRefreshFilters: func.isRequired
}

const mapStateToProps = ({ populationCourses, locale, populationFilters }) => ({
  populationCourses,
  refreshNeeded: populationFilters.refreshNeeded,
  translate: getTranslate(locale)
})

export default connect(mapStateToProps, {
  getPopulationCourses, dispatchRefreshFilters: refreshFilters
})(PopulationCourses)
