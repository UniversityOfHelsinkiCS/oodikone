import React from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, string } from 'prop-types'
import { Segment, Header, Popup, Button } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'

import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import { getPopulationCourses } from '../../redux/populationCourses'
import { refreshFilters } from '../../redux/populationFilters'

const PopulationCourses = ({
  populationCourses,
  filters,
  courseTableFilters,
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

  const filtersAreEqual = () => {
    if (filters.length !== courseTableFilters.length) return false
    if (filters.find(fil => !courseTableFilters.includes(fil.id))) return false
    return true
  }

  return (
    <Segment>
      <Button
        content="Refresh table"
        labelPosition="right"
        primary
        onClick={reloadCourses}
        floated="right"
        icon="refresh"
        compact
        disabled={filtersAreEqual()}
      />
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
  )
}

PopulationCourses.propTypes = {
  populationCourses: shape({}).isRequired,
  filters: arrayOf(shape({})).isRequired,
  courseTableFilters: arrayOf(string).isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  getPopulationCourses: func.isRequired,
  dispatchRefreshFilters: func.isRequired
}

const mapStateToProps = ({ populationCourses, locale, populationFilters }) => ({
  populationCourses,
  filters: populationFilters.filters,
  courseTableFilters: populationFilters.courseTableFilters,
  translate: getTranslate(locale)
})

export default connect(mapStateToProps, {
  getPopulationCourses, dispatchRefreshFilters: refreshFilters
})(PopulationCourses)
