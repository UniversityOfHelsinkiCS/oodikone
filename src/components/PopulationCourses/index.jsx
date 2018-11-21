import React from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, object } from 'prop-types'
import { Segment, Header, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'

const PopulationCourses = ({ samples, translate }) => {
  const isValidSample = samples && samples.length > 0

  if (!isValidSample) {
    return null
  }

  const { pending } = samples[0]
  return (
    <Segment>
      <Popup
        trigger={<Header size="medium" dividing>{translate('populationCourses.header')}</Header>}
        content="Sort by clicking columns. Click course name to limit observed population to students who participated to the course."
        wide
        position="top left"
      />
      <SegmentDimmer translate={translate} isLoading={pending} />
      {samples.map(sample => (
        <PopulationCourseStats
          key={sample.query.uuid}
          courses={sample.data || {}}
          query={sample.query}
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
