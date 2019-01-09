import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, bool, string, object } from 'prop-types'
import { Form, Button, Message, Icon, Grid } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'
import Datetime from 'react-datetime'
import _ from 'lodash'
import moment from 'moment'

import { getPopulationStatistics, clearPopulations } from '../../redux/populations'
import { getPopulationCourses } from '../../redux/populationCourses'
import { getPopulationFilters, setPopulationFilter } from '../../redux/populationFilters'
import { getMandatoryCourses } from '../../redux/populationMandatoryCourses'
import { transferTo } from '../../populationFilters'

import { getDegreesAndProgrammes } from '../../redux/populationDegreesAndProgrammes'
import { isInDateFormat, momentFromFormat, reformatDate, isValidYear, textAndDescriptionSearch } from '../../common'
import { setLoading } from '../../redux/graphSpinner'
import LanguageChooser from '../LanguageChooser'
import style from './populationSearchForm.css'
import { dropdownType } from '../../constants/types'
import InfoBox from '../InfoBox'
import infoToolTips from '../../common/InfoToolTips'

const YEAR_DATE_FORMAT = 'YYYY'

class PopulationSearchForm extends Component {
  static propTypes = {
    language: string.isRequired,
    translate: func.isRequired,
    getDegreesAndProgrammes: func.isRequired,
    getPopulationStatistics: func.isRequired,
    getPopulationCourses: func.isRequired,
    getMandatoryCourses: func.isRequired,
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

    this.state = {
      query: this.initialQuery(),
      isLoading: false,
      showAdvancedSettings: false,
      validYear: true,
      floatMonths: this.months('2017', 'FALL'),
      asUser: null
    }
  }

  componentDidMount() {
    const { studyProgrammes, asUser } = this.props
    if (asUser !== this.state.asUser || !studyProgrammes || studyProgrammes.length === 0) {
      this.setState({ asUser: asUser, query: this.initialQuery() }) // eslint-disable-line
      this.props.getDegreesAndProgrammes()
    }
  }

  componentDidUpdate() {
    const { studyProgrammes, asUser } = this.props
    if (studyProgrammes
      && Object.values(studyProgrammes).length === 1
      && !this.state.query.studyRights.programme) {
      this.handleProgrammeChange(null, { value: Object.values(studyProgrammes)[0].code })
    }
    if (asUser !== this.state.asUser) {
      this.setState({ asUser: asUser, query: this.initialQuery() }) // eslint-disable-line
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
      this.props.getPopulationFilters(request),
      this.props.getMandatoryCourses(query.studyRights.programme)
    ]).then(() => {
      if (queryCodes[0] === 'KH50_001') {
        this.props.setPopulationFilter(transferTo(false))
      }
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
          months: this.months(
            reformatDate(year, YEAR_DATE_FORMAT),
            this.state.query.semesters.includes('FALL') ? 'FALL' : 'SPRING'
          )
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

  handleStudentStatusSelection = (e, { value }) => {
    const { query } = this.state
    const studentStatuses = query.studentStatuses.includes(value) ?
      query.studentStatuses.filter(s => s !== value) : [...query.studentStatuses, value]
    this.setState({
      query: {
        ...query,
        studentStatuses
      }
    })
  }

  handleDegreeChange = (e, { value }) => {
    const { query } = this.state
    const degree = value
    if (degree === '') {
      this.handleClear('degree')
      return
    }
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
    if (programme === '') {
      this.handleClear('programme')
      return
    }
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
    if (studyTrack === '') {
      this.handleClear('studyTrack')
      return
    }
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
    this.setState({
      floatMonths: moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths()
    })
    return Math.ceil(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
  }

  getMonthValue = (year, months) => {
    const start = `${year}-08-01`
    return moment(start).add(months - 1, 'months').format('MMMM YY')
  }

  getMinSelection = (year, semester) => (semester === 'FALL' ? `${year}-08-01` : `${year}-01-01`)

  initialQuery = () => ({
    year: '2017',
    semesters: ['FALL', 'SPRING'],
    studentStatuses: [],
    studyRights: [],
    months: this.months('2017', 'FALL')
  })

  renderableList = (list) => {
    const { language } = this.props
    return list.map((sp) => {
      const shh = {}
      Object.assign(shh, sp)
      shh.text = (sp.name[language] || `${(sp.name.fi || sp.name.en || sp.name.sv)} (translation not found)`)
      shh.description = sp.code
      shh.value = sp.code
      return shh
    })
  }

  renderEnrollmentDateSelector = () => {
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
            value={`${year}-${moment().year(year).add(1, 'years').format('YYYY')}`}
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
          <label>Statistics until</label>
          <Datetime
            dateFormat="MMMM YYYY"
            defaultValue={this.getMonthValue(this.state.query.year, this.state.floatMonths)}
            onChange={value => this.handleMonthsChange(value)}
            isValidDate={current => current.isBefore(moment()) &&
              current.isAfter(this.getMinSelection(year, semesters[1] || semesters[0]))}
          />
        </Form.Field>
      </Form.Group>
    )
  }

  renderStudyProgrammeDropdown = (studyRights, programmesToRender) => (
    <Form.Field width={14}>
      <label>Study programme</label>
      <Form.Dropdown
        placeholder="Select study programme"
        search={textAndDescriptionSearch}
        selection
        noResultsMessage="No selectable study programmes"
        value={studyRights.programme}
        options={programmesToRender}
        onChange={this.handleProgrammeChange}
        closeOnChange
        disabled={programmesToRender.length === 1}
        clearable
      />
    </Form.Field>
  )
  renderAdditionalDegreeOrStudyTrackDropdown = (studyRights, studyTracksToRender, degreesToRender) => { //eslint-disable-line
    const renderableDegrees = () => (
      <React.Fragment>
        <label>Degree (Optional)</label>
        <Form.Dropdown
          placeholder="Select degree"
          search={textAndDescriptionSearch}
          floating
          selection
          noResultsMessage="No selectable degrees"
          value={studyRights.degree}
          options={degreesToRender}
          onChange={this.handleDegreeChange}
          closeOnChange
          clearable
        />
      </React.Fragment>)
    const renderableTracks = () => (
      <React.Fragment>
        <label>Study Track (Optional)</label>
        <Form.Dropdown
          placeholder="Select study track"
          search={textAndDescriptionSearch}
          floating
          selection
          noResultsMessage="No selectable study track"
          value={studyRights.studyTrack}
          options={studyTracksToRender}
          onChange={this.handleStudyTrackChange}
          closeOnChange
          clearable
        />
      </React.Fragment>)
    const isOldProgramme = programme => programme.length > 1 && Number(programme[0])
    if (studyRights.programme &&
      isOldProgramme(studyRights.programme) &&
      degreesToRender.length > 1 &&
      studyTracksToRender.length > 1) {
      return (
        <Form.Group>
          <Form.Field width={8}>
            {renderableDegrees()}
          </Form.Field>
          <Form.Field width={8}>
            {renderableTracks()}
          </Form.Field>
        </Form.Group>
      )
    } else if (studyRights.programme && isOldProgramme(studyRights.programme) && degreesToRender.length > 1) {
      return (
        <Form.Group>
          <Form.Field width={8}>
            {renderableDegrees()}
          </Form.Field>
          <Form.Field width={8}>
          </Form.Field>
        </Form.Group>
      )
    } else if (studyRights.programme && studyTracksToRender.length > 1) {
      return (
        <Form.Group>
          <Form.Field width={8}>
          </Form.Field>
          <Form.Field width={8}>
            {renderableTracks()}
          </Form.Field>
        </Form.Group>
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
      return (
        <Message
          error
          color="red"
          header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi"
        />
      )
    }

    let sortedStudyProgrammes = studyProgrammes
    let programmesToRender
    if (studyProgrammes) {
      sortedStudyProgrammes = _.sortBy(sortedStudyProgrammes, s => s.name[language])
      programmesToRender = this.renderableList(sortedStudyProgrammes)
    }
    let degreesToRender
    if (studyRights.programme) {
      const sortedStudyDegrees =
        _.sortBy(studyProgrammes[studyRights.programme].associations['10'], s => s.name[language])
      degreesToRender = this.renderableList(sortedStudyDegrees)
    }

    let studyTracksToRender
    if (studyRights.programme) {
      const sortedStudyTracks =
        _.sortBy(studyProgrammes[studyRights.programme].associations['30'], s => s.name[language])
      studyTracksToRender = this.renderableList(sortedStudyTracks)
    }
    return (
      <div>
        <Form.Group>
          <Form.Field>
            <label>Language</label>
            <LanguageChooser />
          </Form.Field>
          {this.renderStudyProgrammeDropdown(studyRights, programmesToRender)}
        </Form.Group>
        {this.renderAdditionalDegreeOrStudyTrackDropdown(
          studyRights,
          studyTracksToRender,
          degreesToRender
        )}
      </div>
    )
  }

  renderAdvancedSettingsSelector = () => {
    if (!this.state.showAdvancedSettings) {
      return null
    }
    const { translate } = this.props
    const { query } = this.state
    const { semesters, studentStatuses } = query
    return (
      <div>
        <Form.Group>
          <Form.Field>
            <label>Semesters</label>
            <Form.Checkbox
              className={style.populationStatisticsRadio}
              key="FALL"
              label={translate(`populationStatistics.${'FALL'}`)}
              value="FALL"
              name="semesterGroup"
              checked={semesters.includes('FALL')}
              onChange={this.handleSemesterSelection}
            />
            <Form.Checkbox
              className={style.populationStatisticsRadio}
              key="SPRING"
              label={translate(`populationStatistics.${'SPRING'}`)}
              value="SPRING"
              name="semesterGroup"
              checked={semesters.includes('SPRING')}
              onChange={this.handleSemesterSelection}
            />
          </Form.Field>
        </Form.Group>
        <Form.Group>
          <Form.Field>
            <label>Include</label>
            <Form.Checkbox
              className={style.populationStatisticsRadio}
              key="EXCHANGE"
              label="Exchange students"
              value="EXCHANGE"
              name="studentStatusGroup"
              checked={studentStatuses.includes('EXCHANGE')}
              onChange={this.handleStudentStatusSelection}
            />
            <Form.Checkbox
              className={style.populationStatisticsRadio}
              key="CANCELLED"
              label="Students with cancelled study right"
              value="CANCELLED"
              name="studentStatusGroup"
              checked={studentStatuses.includes('CANCELLED')}
              onChange={this.handleStudentStatusSelection}
            />
          </Form.Field>
        </Form.Group>
      </div>)
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
    const { Advanced } = infoToolTips.PopulationStatistics
    let errorText = translate('populationStatistics.alreadyFetched')
    let isQueryInvalid = this.validateQuery()

    if (!validYear) {
      isQueryInvalid = true
      errorText = translate('populationStatistics.selectValidYear')
    }

    if (query.semesters.length === 0) {
      isQueryInvalid = true
      errorText = 'Select at least one semester'
    }

    if (!query.studyRights.programme) {
      isQueryInvalid = true
      errorText = translate('populationStatistics.selectStudyRights')
    }

    return (
      <Form error={isQueryInvalid} loading={isLoading}>
        <Grid divided>
          <Grid.Row>
            <Grid.Column width={10}>
              {this.renderEnrollmentDateSelector()}
              {this.renderStudyGroupSelector()}
            </Grid.Column>
            <Grid.Column width={6}>
              <Form.Field style={{ margin: 'auto' }}>
                <label>Advanced settings <InfoBox content={Advanced} /></label>
                <Form.Radio
                  toggle
                  checked={this.state.showAdvancedSettings}
                  onClick={() => { this.setState({ showAdvancedSettings: !this.state.showAdvancedSettings }) }}
                />
              </Form.Field>
              {this.renderAdvancedSettingsSelector()}
            </Grid.Column>
          </Grid.Row>
        </Grid>

        <Message error color="blue" header={errorText} />

        <Form.Button onClick={this.fetchPopulation} disabled={isQueryInvalid}>
          {translate('populationStatistics.addPopulation')}
        </Form.Button>
      </Form>
    )
  }
}

const mapStateToProps = ({ settings, populations, populationDegreesAndProgrammes, locale }) => {
  const { language, asUser } = settings
  const studyRights = populationDegreesAndProgrammes.data || {}
  const { pending } = populationDegreesAndProgrammes
  return ({
    language,
    asUser,
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
  getMandatoryCourses: id => dispatch(getMandatoryCourses(id)),
  setPopulationFilter: filter => dispatch(setPopulationFilter(filter)),
  getDegreesAndProgrammes: () => dispatch(getDegreesAndProgrammes()),
  clearPopulations: () => dispatch(clearPopulations()),
  setLoading: () => dispatch(setLoading())
})

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchForm)
