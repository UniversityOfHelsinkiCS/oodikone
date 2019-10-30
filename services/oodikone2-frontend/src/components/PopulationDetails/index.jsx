import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, object, string, arrayOf, bool, shape } from 'prop-types'
import { Segment, Header, Message, Button, Icon, Tab } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { flattenDeep } from 'lodash'
import scrollToComponent from 'react-scroll-to-component'
import selectors from '../../selectors/populationDetails'
import { getTotalCreditsFromCourses } from '../../common'
import PopulationFilters from '../PopulationFilters'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import CourseQuarters from '../CourseQuarters'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import PopulationCreditGainTable from '../PopulationCreditGainTable'
import InfoBox from '../InfoBox'
import infoTooltips from '../../common/InfoToolTips'

class PopulationDetails extends Component {
  static propTypes = {
    translate: func.isRequired,
    samples: arrayOf(object).isRequired,
    selectedStudents: arrayOf(string).isRequired,
    queryIsSet: bool.isRequired,
    isLoading: bool.isRequired,
    selectedStudentsByYear: shape({}).isRequired,
    query: shape({}).isRequired
  }

  constructor() {
    super()
    this.chart = React.createRef()
    this.courses = React.createRef()
    this.students = React.createRef()
    this.filters = React.createRef()
    this.state = {
      navigationVisible: false
    }
  }

  renderCourseStatistics = () => {
    const { samples, translate } = this.props
    const { CreditStatistics } = infoTooltips.PopulationStatistics
    let statistics = null
    if (samples) {
      statistics = (
        <Tab
          menu={{ pointing: true }}
          panes={[
            {
              menuItem: 'Credits gained',
              render: () => (
                <Tab.Pane attached={false}>
                  <PopulationCreditGainTable
                    sample={samples.filter(s => this.props.selectedStudents.includes(s.studentNumber))}
                    translate={translate}
                  />
                </Tab.Pane>
              )
            },
            {
              menuItem: 'Quarters',
              render: () => (
                <Tab.Pane attached={false}>
                  <CourseQuarters
                    sample={samples.filter(s => this.props.selectedStudents.includes(s.studentNumber))}
                    translate={translate}
                  />
                </Tab.Pane>
              )
            }
          ]}
        />
      )
    }
    return (
      <Segment>
        <Header size="medium" dividing>
          {translate('populationStatistics.creditStatisticsHeader')}
          <InfoBox content={CreditStatistics} />
        </Header>
        {statistics}
      </Segment>
    )
  }

  renderCreditGainGraphs = () => {
    const { samples, translate } = this.props
    const { CreditAccumulationGraph } = infoTooltips.PopulationStatistics
    const graphs = (
      <CreditAccumulationGraphHighCharts
        students={samples}
        title={`${translate('populationStatistics.sampleId')}`}
        translate={translate}
        label={samples.label}
        maxCredits={samples.maxCredits}
        selectedStudents={this.props.selectedStudents}
        ref={this.chart}
      />
    )
    return (
      <Segment>
        <Header size="medium" dividing>
          {translate('populationStatistics.graphSegmentHeader')} (for {this.props.selectedStudents.length} students)
          <InfoBox content={CreditAccumulationGraph} />
        </Header>
        {samples.length > 0 ? graphs : null}
      </Segment>
    )
  }

  renderNavigationPanel = () => (
    <div>
      <Segment className="navigationpanel" style={{ position: 'fixed', right: '2%', bottom: '2%' }}>
        <Header size="medium" textAlign="center">
          Navigation
          <Button
            className="navigationbuttonclose"
            icon
            basic
            floated="right"
            onClick={() => this.setState({ navigationVisible: false })}
          >
            <Icon name="chevron right" />
          </Button>
        </Header>
        <Button.Group vertical>
          <Button onClick={() => scrollToComponent(this.filters.current, { align: 'top', offset: -40 })}>
            Go To Filters
          </Button>
          <Button onClick={() => scrollToComponent(this.chart.current, { align: 'middle' })}>Go To Chart</Button>
          <Button onClick={() => scrollToComponent(this.courses.current, { align: 'top', offset: -40 })}>
            Go To Course List
          </Button>
          <Button onClick={() => scrollToComponent(this.students.current, { align: 'top', offset: -40 })}>
            Go To Student List
          </Button>
        </Button.Group>
      </Segment>
    </div>
  )

  renderPopulationDetailsContent = () => (
    <div>
      <PopulationFilters ref={this.filters} samples={this.props.samples} />
      {this.renderCreditGainGraphs()}
      {!this.props.query.years ? this.renderCourseStatistics() : null}
      <PopulationCourses
        ref={this.courses}
        selectedStudents={this.props.selectedStudents}
        selectedStudentsByYear={this.props.selectedStudentsByYear}
        query={this.props.query}
      />
      <PopulationStudents ref={this.students} />
    </div>
  )

  render() {
    const { samples, translate, queryIsSet, isLoading } = this.props
    if (isLoading || !queryIsSet) {
      return null
    }
    if (samples.length === 0) {
      return <Message negative content={`${translate('populationStatistics.emptyQueryResult')}`} />
    }
    if (this.state.navigationVisible) {
      return (
        <div>
          {this.renderPopulationDetailsContent()}
          {this.renderNavigationPanel()}
        </div>
      )
    }
    return (
      <div>
        {this.renderPopulationDetailsContent()}
        <div>
          <Button
            className="navigationbuttonopen"
            icon
            basic
            onClick={() => this.setState({ navigationVisible: true })}
            style={{ position: 'fixed', right: '0.5%', bottom: '0.5%' }}
          >
            <Icon name="bars" />
          </Button>
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => {
  const { samples, selectedStudents, complemented, selectedStudentsByYear } = selectors.makePopulationsToData(state)

  // REFACTOR YES, IF YOU SEE THIS COMMENT YOU ARE OBLIGATED TO FIX IT
  if (samples.length > 0) {
    const creditsAndDates = samples.map(s => {
      const passedCourses = s.courses.filter(c => c.passed)
      const passedCredits = getTotalCreditsFromCourses(passedCourses)
      const dates = passedCourses.map(c => c.date)
      const datesWithCredits = passedCourses.filter(c => c.credits > 0).map(c => c.date)
      return { passedCredits, dates, datesWithCredits }
    })
    const credits = creditsAndDates.map(cd => cd.passedCredits)
    const dates = flattenDeep(creditsAndDates.map(cd => cd.dates)).map(date => new Date(date).getTime())
    const datesWithCredits = flattenDeep(creditsAndDates.map(cd => cd.datesWithCredits)).map(date =>
      new Date(date).getTime()
    )
    samples.maxCredits = Math.max(...credits)
    samples.maxDate = Math.max(...dates)
    samples.minDate = Math.min(...dates)
    samples.minDateWithCredits = Math.min(...datesWithCredits)
  }

  return {
    samples,
    selectedStudents,
    selectedStudentsByYear,
    complemented,
    translate: getTranslate(state.localize),
    queryIsSet: !!state.populations.query,
    isLoading: state.populations.pending === true,
    query: state.populations.query || {}
  }
}

export default connect(mapStateToProps)(PopulationDetails)
