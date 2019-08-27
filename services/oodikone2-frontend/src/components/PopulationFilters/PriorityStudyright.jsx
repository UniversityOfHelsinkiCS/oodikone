import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'
import infoTooltips from '../../common/InfoToolTips'
import { priorityStudyright } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { getTextIn } from '../../common'

class PriorityStudyright extends Component {
  static propTypes = {
    language: string.isRequired,
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    studyrights: shape({}).isRequired
  }

  state = {
    prioritycode: undefined,
    degree: undefined,
    programme: undefined
  }

  graduationOptions = [
    { value: 'grad', text: 'graduated' },
    { value: 'either', text: 'studying' }
  ] // illegal to pass boolean values as Dropdown options value :(

  priorityOptions = [{ value: 1, text: 'primary studies' }, { value: 2, text: 'non-primary studies' }]

  handleChange = (e, data) => {
    this.setState({ [data.name]: data.value })
  }

  handleLimit = () => {
    const { prioritycode, degree, programme } = this.state
    this.props.setPopulationFilter(priorityStudyright({
      prioritycode, degree, programme
    }))
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  renderSetText = (filter, studyrights) => {
    const { language } = this.props
    const { prioritycode, degree, programme } = filter.params
    let returnText = 'Showing students that has '
    if (degree && programme) {
      const degreeText = studyrights.degrees.find(sr => sr.code === degree)
      const programmeText = studyrights.programmes.find(sr => sr.code === programme)
      returnText = returnText.concat(`${degreeText ? getTextIn(degreeText.name, language) : ''} and
        ${programmeText ? getTextIn(programmeText.name, language) : ''}`)
    } else if (degree && !programme) {
      const degreeText = studyrights.degrees.find(sr => sr.code === degree)
      returnText = returnText.concat(`${degreeText ? getTextIn(degreeText.name, language) : ''}`)
    } else if (!degree && programme) {
      const programmeText = studyrights.programmes.find(sr => sr.code === programme)
      returnText = returnText.concat(`${programmeText ? getTextIn(programmeText.name, language) : ''}`)
    }
    returnText = returnText.concat(` as ${this.priorityOptions.find(option => option.value === prioritycode).text} `)
    return returnText
  }

  render() {
    const { filter, language, studyrights } = this.props

    let degreeOptions = studyrights.degrees.map(sr =>
      ({ value: sr.code, text: getTextIn(sr.name, language) }))
    degreeOptions = [{ value: 'anyDegree', text: 'any degree' }, ...degreeOptions]

    let programmeOptions = studyrights.programmes.map(sr =>
      ({ value: sr.code, text: getTextIn(sr.name, language) }))
    programmeOptions = [{ value: 'anyProgramme', text: 'any programme' }, ...programmeOptions]

    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup
              content={infoTooltips.PopulationStatistics.Filters.ExtentGraduated}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                <label>Students that has</label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  search
                  fluid
                  name="degree"
                  placeholder="degree"
                  onChange={this.handleChange}
                  options={degreeOptions}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
              </Form.Field>
              <Form.Field>
                <label>
                  and
                </label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  search
                  fluid
                  name="programme"
                  placeholder="programme"
                  onChange={this.handleChange}
                  options={programmeOptions}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
              </Form.Field>
              <Form.Field>
                <label>as</label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  fluid
                  placeholder="priority"
                  name="prioritycode"
                  onChange={this.handleChange}
                  options={this.priorityOptions}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleLimit}
                  disabled={this.state.prioritycode === undefined ||
                    (this.state.degree === undefined && this.state.programme === undefined)}
                >
                  set filter
                </Button>

              </Form.Field>
            </Form.Group>
          </Form>
        </Segment>
      )
    }

    return (
      <Segment>
        <label>
          {this.renderSetText(filter, studyrights)}
        </label>
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ localize, populations }) => ({
  language: getActiveLanguage(localize).code,
  studyrights: populations.data.studyrights
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(PriorityStudyright)
