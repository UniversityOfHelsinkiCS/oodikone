import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, shape } from 'prop-types'
import { Form, Button, Message, Radio, Dropdown } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'
import Datetime from 'react-datetime'
import { isEqual } from 'lodash'
import moment from 'moment'

import { getPopulationStatistics, clearPopulations } from '../../redux/populations'
import { getPopulationCourses } from '../../redux/populationCourses'
import { getUnits } from '../../redux/units'
import { isInDateFormat, momentFromFormat, reformatDate, isValidYear } from '../../common'
import { makeMapRightsToDropDown } from '../../selectors/populationSearchForm'
import { setLoading } from '../../redux/graphSpinner'

import style from './populationSearchForm.css'
import { dropdownType } from '../../constants/types'

const YEAR_DATE_FORMAT = 'YYYY'

class PopulationSearchForm extends Component {
  static propTypes = {
    translate: func.isRequired,
    getUnits: func.isRequired,
    getPopulationStatistics: func.isRequired,
    getPopulationCourses: func.isRequired,
    clearPopulations: func.isRequired,
    queries: shape({}).isRequired,
    studyProgrammes: arrayOf(dropdownType).isRequired,
    setLoading: func.isRequired
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
    if (studyProgrammes.length === 0) {
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
    return isEqual(compare, query)
  }

  clearPopulations = () => this.props.clearPopulations()

  fetchPopulation = () => {
    const { query } = this.state
    const uuid = uuidv4()
    const request = { ...query, uuid }
    this.setState({ isLoading: true })
    this.props.setLoading()
    Promise.all([
      this.props.getPopulationStatistics(request),
      this.props.getPopulationCourses(request)
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

  handleStudyRightChange = (e, { value }) => {
    const { query } = this.state
    const studyRights = value.length > 0 ? [value[0]] : []
    this.setState({
      query: {
        ...query,
        studyRights
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
  // (Potential?) issue with using Math.ceil with months.
  getMonths = (year, end, term) => {
    const lastDayOfMonth = moment(end).endOf('month')
    const start = term === 'FALL' ? `${year}-08-01` : `${year}-01-01`
    return Math.ceil(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
  }

  getMinSelection = (year, semester) => { // eslint-disable-line
    return semester === 'FALL' ? `${year}-08-01` : `${year}-01-01`
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
            <Button icon="plus" className={style.yearControlButton} onClick={this.addYear} />
            <Button icon="minus" className={style.yearControlButton} onClick={this.subtractYear} />
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
            dateFormat="YYYY-MMM"
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
    const { studyProgrammes, translate } = this.props
    const { studyRights } = this.state.query

    return (
      <Form.Group id="rightGroup">
        <Form.Field width={8}>
          <label htmlFor="rightGroup">{translate('populationStatistics.studyRights')}</label>
          <Dropdown
            placeholder={translate('populationStatistics.selectStudyRights')}
            multiple
            search
            selection
            noResultsMessage={translate('populationStatistics.noSelectableStudyRights')}
            value={studyRights}
            options={studyProgrammes}
            onChange={this.handleStudyRightChange}
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

const mapStateToProps = ({ populations, units, locale }) => ({
  queries: populations.query || {},
  translate: getTranslate(locale),
  studyProgrammes: mapRightsToDropdown(units)
})

const mapDispatchToProps = dispatch => ({
  getPopulationStatistics: request => dispatch(getPopulationStatistics(request)),
  getPopulationCourses: request => dispatch(getPopulationCourses(request)),
  getUnits: () => dispatch(getUnits()),
  clearPopulations: () => dispatch(clearPopulations()),
  setLoading: () => dispatch(setLoading())
})

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchForm)
