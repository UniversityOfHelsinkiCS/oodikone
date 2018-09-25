import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, bool, string, object } from 'prop-types'
import { Form, Button, Message, Dropdown, Icon, Checkbox } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'
import Datetime from 'react-datetime'
import _ from 'lodash'
import moment from 'moment'

import { getPopulationStatistics, clearPopulations } from '../../redux/populations'
import { getPopulationCourses } from '../../redux/populationCourses'
import { getPopulationFilters, setPopulationFilter } from '../../redux/populationFilters'
import { extentGraduated, canceledStudyright } from '../../populationFilters'

import { getDegreesAndProgrammes } from '../../redux/populationDegreesAndProgrammes'
import { isInDateFormat, momentFromFormat, reformatDate, isValidYear } from '../../common'
import { setLoading } from '../../redux/graphSpinner'
import LanguageChooser from '../LanguageChooser'
import style from './populationSearchForm.css'
import { dropdownType } from '../../constants/types'

const YEAR_DATE_FORMAT = 'YYYY'

class PopulationSearchForm extends Component {
  static propTypes = {
    language: string.isRequired,
    translate: func.isRequired,
    getDegreesAndProgrammes: func.isRequired,
    getPopulationStatistics: func.isRequired,
    getPopulationCourses: func.isRequired,
    getPopulationFilters: func.isRequired,
    setPopulationFilter: func.isRequired,
    clearPopulations: func.isRequired,
    queries: shape({}).isRequired,
    studyProgrammes: shape({}), //eslint-disable-line
    degrees: arrayOf(dropdownType), //eslint-disable-line
    studyTracks: arrayOf(dropdownType), //eslint-disable-line
    setLoading: func.isRequired,
    extents: arrayOf(object).isRequired,
    pending: bool //eslint-disable-line
  }

  constructor() {
    super()

    const INITIAL_QUERY = {
      year: '2017',
      semesters: ['FALL', 'SPRING'],
      studyRights: [],
      months: this.months('2017', 'FALL')
    }

    this.state = {
      query: INITIAL_QUERY,
      isLoading: false,
      validYear: true
    }
  }

  componentDidMount() {
    const { studyProgrammes } = this.props
    if (!studyProgrammes || studyProgrammes.length === 0) {
      this.props.getDegreesAndProgrammes()
    }
  }

  months(year, term) { // eslint-disable-line
    const start = term === 'FALL' ? `${year}-08-01` : moment(`${year}-01-01`).add(1, 'years')
    return Math.ceil(moment.duration(moment().diff(moment(start))).asMonths())
  }

  validateQuery = () => {
    const { queries } = this.props
    const { query } = this.state
    const compare = { ...queries }
    delete compare.uuid
    return _.isEqual(compare, query)
  }

  clearPopulations = () => this.props.clearPopulations()

  fetchPopulation = () => {
    const { query } = this.state
    let queryCodes = []
    queryCodes = [...Object.values(query.studyRights)]

    const backendQuery = { ...query, studyRights: queryCodes }
    const uuid = uuidv4()
    const request = { ...backendQuery, uuid }
    this.setState({ isLoading: true })
    this.props.setLoading()
    Promise.all([
      this.props.getPopulationStatistics(request),
      this.props.getPopulationCourses(request),
      this.props.getPopulationFilters(request)
    ]).then(() => {
      if (this.props.extents.map(e => e.extentcode).includes(7)) {
        this.props.setPopulationFilter(extentGraduated({ extentcode: 7, graduated: 'either', complemented: 'true' }))
      }
      if (this.props.extents.map(e => e.extentcode).includes(34)) {
        this.props.setPopulationFilter(extentGraduated({ extentcode: 34, graduated: 'either', complemented: 'true' }))
      }
      this.props.setPopulationFilter(canceledStudyright({ studyrights: queryCodes, canceled: 'false' }))
      this.setState({ isLoading: false })
    })
  }

  handleYearSelection = (year) => {
    const { query } = this.state
    const validYear = isInDateFormat(year, YEAR_DATE_FORMAT) && isValidYear(year)
    if (validYear) {
      this.setState({
        validYear,
        query: {
          ...query,
          year: reformatDate(year, YEAR_DATE_FORMAT),
          months: this.months(reformatDate(year, YEAR_DATE_FORMAT), this.state.query.semesters.includes('FALL') ? 'FALL' : 'SPRING')
        }
      })
    } else {
      this.setState({ validYear })
    }
  }

  addYear = () => {
    const { year } = this.state.query
    const nextYear = momentFromFormat(year, YEAR_DATE_FORMAT).add(1, 'year')
    this.handleYearSelection(nextYear)
  }

  subtractYear = () => {
    const { year } = this.state.query
    const previousYear = momentFromFormat(year, YEAR_DATE_FORMAT).subtract(1, 'year')
    this.handleYearSelection(previousYear)
  }

  handleSemesterSelection = (e, { value }) => {
    const { query } = this.state
    const semesters = query.semesters.includes(value) ?
      query.semesters.filter(s => s !== value) : [...query.semesters, value]
    this.setState({
      query: {
        ...query,
        semesters,
        months: this.months(this.state.query.year, semesters.includes('FALL') ? 'FALL' : 'SPRING')
      }
    })
  }

  handleDegreeChange = (e, { value }) => {
    const { query } = this.state
    const degree = value
    this.setState({
      query: {
        ...query,
        studyRights: {
          ...query.studyRights,
          degree
        }
      }
    })
  }
  handleProgrammeChange = (e, { value }) => {
    const { query } = this.state
    const programme = value

    this.setState({
      query: {
        ...query,
        studyRights: {
          programme
        }
      }
    })
  }
  handleStudyTrackChange = (e, { value }) => {
    const { query } = this.state
    const studyTrack = value

    this.setState({
      query: {
        ...query,
        studyRights: {
          ...query.studyRights,
          studyTrack
        }
      }
    })
  }

  handleMonthsChange = (value) => {
    const { query } = this.state
    const months = this.getMonths(query.year, value, this.state.query.semesters.includes('FALL') ? 'FALL' : 'SPRING')
    this.setState({
      query: {
        ...query,
        months
      }
    })
  }

  handleClear = (type) => {
    const { query } = this.state
    this.setState({
      query: {
        ...query,
        studyRights: {
          ...query.studyRights,
          [type]: undefined
        }
      }
    })
  }


  // (Potential?) issue with using Math.ceil with months.
  getMonths = (year, end, term) => {
    const lastDayOfMonth = moment(end).endOf('month')
    const start = term === 'FALL' ? `${year}-08-01` : `${year}-01-01`
    return Math.ceil(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
  }

  getMinSelection = (year, semester) => (semester === 'FALL' ? `${year}-08-01` : `${year}-01-01`)


  renderableList = (list) => {
    const { language } = this.props
    return list.map((sp) => {
      const shh = {}
      Object.assign(shh, sp)
      shh.text = `${sp.name[language]} (${sp.code})`
      shh.value = sp.code
      return shh
    })
  }

  renderEnrollmentDateSelector = () => {
    const { translate } = this.props
    const { query, validYear } = this.state
    const { semesters, year } = query
    return (
      <Form.Group key="year" className={style.enrollmentSelectorGroup}>
        <Form.Field error={!validYear} className={style.yearSelect}>
          <label>Enrollment</label>
          <Datetime
            className={style.yearSelectInput}
            control={Datetime}
            dateFormat={YEAR_DATE_FORMAT}
            timeFormat={false}
            renderYear={(props, selectableYear) => <td {...props}>{`${selectableYear}-${selectableYear + 1}`}</td>}
            closeOnSelect
            value={`${year}-${moment(year).add(1, 'years').format('YYYY')}`}
            isValidDate={isValidYear}
            onChange={this.handleYearSelection}
          />
        </Form.Field>
        <Form.Field className={style.yearControl}>
          <Button.Group basic vertical className={style.yearControlButtonGroup}>
            <Button icon="plus" className={style.yearControlButton} onClick={this.addYear} tabIndex="-1" />
            <Button icon="minus" className={style.yearControlButton} onClick={this.subtractYear} tabIndex="-1" />
          </Button.Group>
        </Form.Field>
        <Form.Field>
          <label>Semesters</label>
          <Checkbox
            className={style.semesterRadio}
            key="FALL"
            label={translate(`populationStatistics.${'FALL'}`)}
            value="FALL"
            name="semesterGroup"
            checked={semesters.includes('FALL')}
            onChange={this.handleSemesterSelection}
          />
          <Checkbox
            className={style.semesterRadio}
            key="SPRING"
            label={translate(`populationStatistics.${'SPRING'}`)}
            value="SPRING"
            name="semesterGroup"
            checked={semesters.includes('SPRING')}
            onChange={this.handleSemesterSelection}
          />

        </Form.Field>
        <Form.Field>
          <label>Statistics until</label>
          <Datetime
            dateFormat="MMMM YYYY"
            defaultValue={moment()}
            onChange={value => this.handleMonthsChange(value)}
            isValidDate={current => current.isBefore(moment()) &&
              current.isAfter(this.getMinSelection(year, semesters[1] || semesters[0]))}
          />
        </Form.Field>
      </Form.Group>
    )
  }
  renderStudyProgrammeDropdown = (studyRights, programmesToRender) => (
    <Form.Field
      width={6}
      style={{
        position: 'relative'
      }}
    >
      <label>Study programme</label>

      <Icon
        link
        name="close"
        style={{
          position: 'absolute',
          top: 35,
          bottom: 0,
          right: '2.5em',
          lineHeight: 1,
          zIndex: 1
        }}
        onClick={() => this.handleClear('programme')}
      />
      <Dropdown
        placeholder="Select study programme"
        search
        selection
        noResultsMessage="No selectable study programmes"
        value={studyRights.programme}
        options={programmesToRender}
        onChange={this.handleProgrammeChange}
        closeOnChange
      />
    </Form.Field>
  )
  renderAdditionalDegreeOrStudyTrackDropdown = (studyRights, studyTracksToRender, degreesToRender) => { //eslint-disable-line
    const renderableDegrees = (
      <Form.Field
        style={{
          position: 'relative',
          minWidth: '22em',
          width: 'auto'
        }}
      >
        <Icon
          link
          name="close"
          style={{
            position: 'absolute',
            top: 35,
            bottom: 0,
            right: '2.5em',
            lineHeight: 1,
            zIndex: 1
          }}
          onClick={() => this.handleClear('degree')}
        />
        <label>Degree (Optional)</label>
        <Dropdown
          placeholder="Select degree"
          search
          floating
          selection
          noResultsMessage="No selectable degrees"
          value={studyRights.degree}
          options={degreesToRender}
          onChange={this.handleDegreeChange}
          closeOnChange
        />
      </Form.Field>)
    const renderableTracks = (
      <Form.Field
        style={{
          position: 'relative',
          minWidth: '22em',
          width: 'auto'
        }}
      >
        <Icon
          link
          name="close"
          style={{
            position: 'absolute',
            top: 35,
            bottom: 0,
            right: '2.5em',
            lineHeight: 1,
            zIndex: 1
          }}
          onClick={() => this.handleClear('studyTrack')}
        />
        <label>Study Track (Optional)</label>
        <Dropdown
          placeholder="Select study track"
          search
          floating
          selection
          noResultsMessage="No selectable study track"
          value={studyRights.studyTrack}
          options={studyTracksToRender}
          onChange={this.handleStudyTrackChange}
          closeOnChange
        />
      </Form.Field>)
    if (studyRights.programme && degreesToRender.length > 1 && studyTracksToRender.length > 1) {
      return (
        <Form.Group>
          {renderableDegrees}
          {renderableTracks}
        </Form.Group>
      )
    } else if (studyRights.programme && degreesToRender.length > 1) {
      return (
        <div>
          {renderableDegrees}
        </div>
      )
    } else if (studyRights.programme && studyTracksToRender.length > 1) {
      return (
        <div>
          {renderableTracks}
        </div>
      )
    }
    return null
  }


  renderStudyGroupSelector = () => {
    const { studyProgrammes, language } = this.props
    const { studyRights } = this.state.query
    if (this.props.pending) {
      return (
        <Icon name="spinner" loading size="big" color="black" style={{ marginLeft: '45%' }} />
      )
    }
    if (!studyProgrammes && !this.props.pending) {
      return <Message error color="red" header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi" />
    }

    let sortedStudyProgrammes = studyProgrammes
    let programmesToRender
    if (studyProgrammes) {
      sortedStudyProgrammes = _.sortBy(sortedStudyProgrammes, s => s.name[language])
      programmesToRender = this.renderableList(sortedStudyProgrammes)
    }
    let degreesToRender
    if (studyRights.programme) {
      const sortedStudyDegrees = _.sortBy(studyProgrammes[studyRights.programme].associations['10'], s => s.name[language])
      degreesToRender = this.renderableList(sortedStudyDegrees)
    }

    let studyTracksToRender
    if (studyRights.programme) {
      const sortedStudyTracks = _.sortBy(studyProgrammes[studyRights.programme].associations['30'], s => s.name[language])
      studyTracksToRender = this.renderableList(sortedStudyTracks)
    }
    return (
      <Form.Group horizontal="true" widths={2} >

        <Form.Field
          width={1}
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <label>Language</label>
          <LanguageChooser />
        </Form.Field>
        {this.renderStudyProgrammeDropdown(studyRights, programmesToRender)}
        {this.renderAdditionalDegreeOrStudyTrackDropdown(
          studyRights,
          studyTracksToRender,
          degreesToRender
          )}
      </Form.Group>
    )
  }

  shouldRenderSearchForm = () => {
    const queryIsEmpty = Object.getOwnPropertyNames(this.props.queries).length > 0
    return !queryIsEmpty
  }

  render() {
    if (!this.shouldRenderSearchForm()) {
      return null
    }

    const { translate } = this.props
    const { isLoading, validYear, query } = this.state
    let errorText = translate('populationStatistics.alreadyFetched')
    let isQueryInvalid = this.validateQuery()

    if (!validYear) {
      isQueryInvalid = true
      errorText = translate('populationStatistics.selectValidYear')
    }

    if (query.studyRights.length === 0) {
      isQueryInvalid = true
      errorText = translate('populationStatistics.selectStudyRights')
    }
    return (
      <Form error={isQueryInvalid} loading={isLoading}>
        {this.renderEnrollmentDateSelector()}
        {this.renderStudyGroupSelector()}

        <Message error color="blue" header={errorText} />

        <Button onClick={this.fetchPopulation} disabled={isQueryInvalid}>
          {translate('populationStatistics.addPopulation')}
        </Button>
      </Form>
    )
  }
}


const mapStateToProps = ({ settings, populations, populationDegreesAndProgrammes, locale }) => {
  const studyRights = populationDegreesAndProgrammes.data || {}
  const { pending } = populationDegreesAndProgrammes
  return ({
    language: settings.language,
    queries: populations.query || {},
    translate: getTranslate(locale),
    studyProgrammes: studyRights['20'],
    pending,
    extents: populations.data.extents || []
  })
}

const mapDispatchToProps = dispatch => ({
  getPopulationStatistics: request => dispatch(getPopulationStatistics(request)),
  getPopulationCourses: request => dispatch(getPopulationCourses(request)),
  getPopulationFilters: request => dispatch(getPopulationFilters(request)),
  setPopulationFilter: filter => dispatch(setPopulationFilter(filter)),
  getDegreesAndProgrammes: () => dispatch(getDegreesAndProgrammes()),
  clearPopulations: () => dispatch(clearPopulations()),
  setLoading: () => dispatch(setLoading())
})

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchForm)
