import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, bool, string } from 'prop-types'
import { Form, Button, Message, Radio, Dropdown, Icon } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'
import Datetime from 'react-datetime'
import _ from 'lodash'
import moment from 'moment'

import { getPopulationStatistics, clearPopulations } from '../../redux/populations'
import { getPopulationCourses } from '../../redux/populationCourses'
import { getPopulationFilters } from '../../redux/populationFilters'

import { getUnits } from '../../redux/units'
import { isInDateFormat, momentFromFormat, reformatDate, isValidYear } from '../../common'
import { makeMapRightsToDropDown } from '../../selectors/populationSearchForm'
import { setLoading } from '../../redux/graphSpinner'
import LanguageChooser from '../LanguageChooser'
import style from './populationSearchForm.css'
import { dropdownType } from '../../constants/types'

const YEAR_DATE_FORMAT = 'YYYY'

class PopulationSearchForm extends Component {
  static propTypes = {
    language: string.isRequired,
    translate: func.isRequired,
    getUnits: func.isRequired,
    getPopulationStatistics: func.isRequired,
    getPopulationCourses: func.isRequired,
    getPopulationFilters: func.isRequired,
    clearPopulations: func.isRequired,
    queries: shape({}).isRequired,
    studyProgrammes: arrayOf(dropdownType), //eslint-disable-line
    degrees: arrayOf(dropdownType), //eslint-disable-line
    setLoading: func.isRequired,
    pending: bool //eslint-disable-line
  }

  constructor() {
    super()

    const INITIAL_QUERY = {
      year: '2017',
      semester: 'FALL',
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
      this.props.getUnits()
    }
  }

  months(year, term) { // eslint-disable-line
    const start = term === 'FALL' ? `${year}-08-01` : `${year}-01-01`
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
    // ":D"
    if (query.studyRights.degree && query.studyRights.programme) {
      queryCodes = [query.studyRights.degree, query.studyRights.programme]
    } else if (query.studyRights.degree && !query.studyRights.programme) {
      queryCodes = [query.studyRights.degree]
    } else if (!query.studyRights.degree && query.studyRights.programme) {
      queryCodes = [query.studyRights.programme]
    }
    const backendQuery = { ...query, studyRights: queryCodes }
    const uuid = uuidv4()
    const request = { ...backendQuery, uuid }
    this.setState({ isLoading: true })
    this.props.setLoading()
    Promise.all([
      this.props.getPopulationStatistics(request),
      this.props.getPopulationCourses(request),
      this.props.getPopulationFilters(request)
    ]).then(() => this.setState({ isLoading: false }))
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
          months: this.months(reformatDate(year, YEAR_DATE_FORMAT), this.state.query.semester)
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
    this.setState({
      query: {
        ...query,
        semester: value,
        months: this.months(this.state.query.year, value)
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
          ...query.studyRights,
          programme
        }
      }
    })
  }

  handleMonthsChange = (value) => {
    const { query } = this.state
    const months = this.getMonths(query.year, value, this.state.query.semester)
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

  getMinSelection = (year, semester) => { // eslint-disable-line
    return semester === 'FALL' ? `${year}-08-01` : `${year}-01-01`
  }

  renderableList = (list) => {
    const { language } = this.props
    return list.map((sp) => {
      const shh = {}
      Object.assign(shh, sp)
      shh.text = sp.text[language]
      return shh
    })
  }

  renderEnrollmentDateSelector = () => {
    const { translate } = this.props
    const { query, validYear } = this.state
    const { semester, year } = query

    const semesters = ['FALL', 'SPRING']
    return (
      <Form.Group key="year" className={style.enrollmentSelectorGroup}>
        <Form.Field error={!validYear} className={style.yearSelect}>
          <label>{translate('populationStatistics.enrollmentYear')}</label>
          <Datetime
            className={style.yearSelectInput}
            control={Datetime}
            dateFormat={YEAR_DATE_FORMAT}
            timeFormat={false}
            closeOnSelect
            value={year}
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
          <label>{translate('populationStatistics.semester')}</label>
          {semesters.map(s => (
            <Radio
              className={style.semesterRadio}
              key={s}
              label={translate(`populationStatistics.${s}`)}
              value={s}
              name="semesterGroup"
              checked={semester === s}
              onChange={this.handleSemesterSelection}
            />
          ))}
        </Form.Field>
        <Form.Field>
          <label>{translate('populationStatistics.months')}</label>
          <Datetime
            dateFormat="MMMM YYYY"
            defaultValue={moment()}
            onChange={value => this.handleMonthsChange(value)}
            isValidDate={current => current.isBefore(moment()) &&
              current.isAfter(this.getMinSelection(year, semester))}
          />
        </Form.Field>
      </Form.Group>
    )
  }

  renderStudyGroupSelector = () => {
    const { studyProgrammes, degrees, translate, language } = this.props
    const { studyRights } = this.state.query
    if (this.props.pending) {
      return (
        <Icon name="spinner" loading size="big" color="black" style={{ marginLeft: '45%' }} />
      )
    }
    if (!studyProgrammes && !degrees && !this.props.pending) {
      return <Message error color="red" header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi" />
    }

    let sortedStudyProgrammes = studyProgrammes
    let programmesToRender
    if (studyProgrammes) {
      sortedStudyProgrammes = _.sortBy(studyProgrammes.filter((s) => {
        if (studyRights.degree) {
          return s.associations.includes(studyRights.degree)
        }
        return true
      }), s => s.text[language])
      programmesToRender = this.renderableList(sortedStudyProgrammes)
    }

    let sortedStudyDegrees = degrees
    let degreesToRender
    if (sortedStudyDegrees) {
      sortedStudyDegrees = _.sortBy(degrees.filter((d) => {
        if (studyRights.programme) {
          return d.associations.includes(studyRights.programme)
        }
        return true
      }), s => s.text[language])
      degreesToRender = this.renderableList(sortedStudyDegrees)
    }
    return (
      <Form.Group id="rightGroup" horizontal="true" >
        <Form.Field
          width={1}
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <label htmlFor="rightGroup">Language</label>
          <LanguageChooser />
        </Form.Field>
        <Form.Field
          width={6}
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <Icon
            link
            name="close"
            style={{
              position: 'absolute',
              top: 22,
              bottom: 0,
              margin: 'auto',
              right: '2.5em',
              lineHeight: 1,
              zIndex: 1
            }}
            onClick={() => this.handleClear('degree')}
          />
          <label htmlFor="rightGroup">Degree</label>
          <Dropdown
            placeholder="Select degree"
            search
            selection
            noResultsMessage={translate('populationStatistics.noSelectableStudyRights')}
            value={studyRights.degree}
            options={degreesToRender}
            onChange={this.handleDegreeChange}
            closeOnChange
          />
        </Form.Field>
        <Form.Field
          width={6}
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <label htmlFor="rightGroup">Study programme</label>

          <Icon
            link
            name="close"
            style={{
              position: 'absolute',
              top: 22,
              bottom: 0,
              margin: 'auto',
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
            noResultsMessage={translate('populationStatistics.noSelectableStudyRights')}
            value={studyRights.programme}
            options={programmesToRender}
            onChange={this.handleProgrammeChange}
            closeOnChange
          />
        </Form.Field>
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

const mapRightsToDropdown = makeMapRightsToDropDown()

const mapStateToProps = ({ settings, populations, units, locale }) => {
  const rawStudyrights = units || []
  const { pending } = units
  const studyRights = mapRightsToDropdown(rawStudyrights)
  return ({
    language: settings.language,
    queries: populations.query || {},
    translate: getTranslate(locale),
    degrees: studyRights['10'],
    studyProgrammes: studyRights['20'],
    pending
  })
}

const mapDispatchToProps = dispatch => ({
  getPopulationStatistics: request => dispatch(getPopulationStatistics(request)),
  getPopulationCourses: request => dispatch(getPopulationCourses(request)),
  getPopulationFilters: request => dispatch(getPopulationFilters(request)),
  getUnits: () => dispatch(getUnits()),
  clearPopulations: () => dispatch(clearPopulations()),
  setLoading: () => dispatch(setLoading())
})

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchForm)
