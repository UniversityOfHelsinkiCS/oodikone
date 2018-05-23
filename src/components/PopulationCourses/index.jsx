import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, object } from 'prop-types'
import { Segment, Header, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import PopulationCourseStats from '../PopulationCourseStats'

class PopulationCourses extends Component {
  isSamplesRenderable = () => {
    const { samples } = this.props
    return samples && samples.length > 0
  }

  render() {
    if (!this.isSamplesRenderable()) {
      return null
    }
    const { samples, translate } = this.props
    return (
      <Segment>
        <Popup
          trigger={<Header size="medium" dividing>{translate('populationCourses.header')}</Header>}
          content="Sort by clicking columns. Click course name to limit observed population to students who participated to the course."
          wide
          position="top left"
        />
        {samples.map(sample => (
          <PopulationCourseStats
            key={sample.query.uuid}
            courses={sample.data}
            query={sample.query}
          />))}
      </Segment>
    )
  }
}

PopulationCourses.propTypes = {
  samples: arrayOf(object).isRequired,
  translate: func.isRequired
}

const mapStateToProps = state => ({
  samples: state.populationCourses,
  translate: getTranslate(state.locale)
})

export default connect(mapStateToProps)(PopulationCourses)
