import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, object } from 'prop-types'
import { Segment, Icon } from 'semantic-ui-react'
import { setPopulationLimitField, clearPopulationLimit } from '../../redux/populationLimit'

class PopulationLimiter extends Component {
  static propTypes = {
    clearPopulationLimit: func.isRequired,
    setPopulationLimitField: func.isRequired,
    selected: object // eslint-disable-line
  }

  selectField = field => () => {
    if (field !== this.props.selected.field) {
      this.props.setPopulationLimitField(field)
    }
  }

  render() {
    const { selected } = this.props

    const active = field =>
      (selected && selected.field === field)

    if (!selected) return null

    return (
      <div>
        <Segment.Group horizontal>
          <Segment>
            <em>{selected.course.course.name}</em>
            <span style={{ float: 'right' }}>
              <Icon name="remove" onClick={() => this.props.clearPopulationLimit()} />
            </span>

          </Segment>
          <Segment
            inverted={active('all')}
            secondary={active('all')}
            onClick={this.selectField('all')}
          >
            all
          </Segment>
          <Segment
            inverted={active('passed')}
            secondary={active('passed')}
            onClick={this.selectField('passed')}
          >
            passed
          </Segment>
          <Segment
            inverted={active('retryPassed')}
            secondary={active('retryPassed')}
            onClick={this.selectField('retryPassed')}
          >
            passed after fail
          </Segment>
          <Segment
            inverted={active('failed')}
            secondary={active('failed')}
            onClick={this.selectField('failed')}
          >
            failed
          </Segment>
          <Segment
            inverted={active('failedMany')}
            secondary={active('failedMany')}
            onClick={this.selectField('failedMany')}
          >
            failed many
          </Segment>
        </Segment.Group>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  selected: state.populationLimit
})

export default connect(mapStateToProps, {
  setPopulationLimitField, clearPopulationLimit
})(PopulationLimiter)
