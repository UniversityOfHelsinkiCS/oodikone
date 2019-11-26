import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dropdown, Icon, Form, Segment, Button } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'
import InfoBox from '../InfoBox'
import infoTooltips from '../../common/InfoToolTips'
import { canceledStudyright } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import Track from './tracking'

class CanceledStudyright extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    studyrights: shape({ programme: string, degree: string, studyTrack: string }).isRequired
  }

  state = {
    cancel: 'true'
  }

  options = [{ value: 'false', text: 'have' }, { value: 'true', text: "haven't" }]

  handleChange = (e, { value }) => {
    this.setState({ cancel: value })
  }

  handleCancel = () => {
    this.props.setPopulationFilter(
      canceledStudyright({
        studyrights: this.props.studyrights,
        cancel: this.state.cancel
      })
    )
    Track.set(__filename)
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
    Track.cleared(__filename)
  }

  render() {
    const { filter } = this.props
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <InfoBox content={infoTooltips.PopulationStatistics.Filters.CanceledStudyright} />
            <Form.Group inline>
              <Form.Field>
                <label>Filter students who </label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  fluid
                  placeholder="have/haven't"
                  name="complemented"
                  onChange={this.handleChange}
                  options={this.options}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
              </Form.Field>
              <Form.Field>
                <label> enrolled present (n)or absent</label>
              </Form.Field>
              <Form.Field>
                <Button onClick={this.handleCancel}>set filter</Button>
              </Form.Field>
            </Form.Group>
          </Form>
        </Segment>
      )
    }

    return (
      <Segment>
        {filter.params.cancel === 'true' ? (
          "Showing students who haven't enrolled present nor absent"
        ) : (
          <span>
            <b>Excluded</b> {"students who haven't enrolled present nor absent"}
          </span>
        )}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ populations }) => ({
  studyrights: populations.query.studyRights
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(CanceledStudyright)
