import React from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, object } from 'prop-types'
import { Segment, Header, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'

const PopulationCourses = ({ samples, translate }) => {
  const isValidSample = samples && samples.length > 0
  const { CoursesOf } = infotooltips.PopulationStatistics
  const pending = !isValidSample || samples[0].pending
  return (
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
      {!pending && samples.map(sample => (
        <PopulationCourseStats
          key={sample.query.uuid}
          courses={sample.data || {}}
          query={sample.query}
          pending={sample.pending}
        />))}
    </Segment>
  )
}

PopulationCourses.propTypes = {
  samples: arrayOf(object).isRequired,
  translate: func.isRequired
}

const mapStateToProps = ({ populationCourses, locale }) => ({
  samples: populationCourses,
  translate: getTranslate(locale)
})

export default connect(mapStateToProps)(PopulationCourses)
