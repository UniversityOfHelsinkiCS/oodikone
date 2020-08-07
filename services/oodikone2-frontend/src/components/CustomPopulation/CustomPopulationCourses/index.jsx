import React from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Header, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import SegmentDimmer from '../../SegmentDimmer'
import PopulationCourseStats from '../../PopulationCourseStats'

const CustomPopulationCourses = ({ translate, courses, pending, selectedStudents, query }) => {
  return (
    <Segment>
      <Header size="medium" dividing>
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
        customPopulation
      />
    </Segment>
  )
}

CustomPopulationCourses.propTypes = {
  pending: bool.isRequired,
  courses: shape([]).isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  query: shape({}).isRequired
}

const mapStateToProps = ({ localize, populationCourses }) => ({
  courses: populationCourses.data,
  pending: populationCourses.pending,
  translate: getTranslate(localize),
  query: populationCourses.query
})

export default connect(mapStateToProps)(CustomPopulationCourses)
