import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, object } from 'prop-types'
import { Segment, Header } from 'semantic-ui-react'
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
        <Header size="medium" dividing>{translate('populationCourses.header')}</Header>
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

const mapDispatchToProps = () => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PopulationCourses)
