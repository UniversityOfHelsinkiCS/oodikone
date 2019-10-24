import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import qs from 'query-string'
import { func, arrayOf, shape, bool, string, object, oneOfType } from 'prop-types'
import { Form, Button, Message, Icon, Grid } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'
import Datetime from 'react-datetime'
import { sortBy, isEqual } from 'lodash'
import moment from 'moment'

import { getPopulationStatistics } from '../../redux/populations'
import { getPopulationCourses } from '../../redux/populationCourses'
import { getPopulationSelectedStudentCourses, clearSelected } from '../../redux/populationSelectedStudentCourses'
import { getPopulationFilters, setPopulationFilter, clearPopulationFilters } from '../../redux/populationFilters'
import { getMandatoryCourses } from '../../redux/populationMandatoryCourses'
import { getSemesters } from '../../redux/semesters'
import { transferTo } from '../../populationFilters'

import { getDegreesAndProgrammes } from '../../redux/populationDegreesAndProgrammes'
import { getTagsByStudytrackAction } from '../../redux/tags'
import {
  momentFromFormat,
  reformatDate,
  textAndDescriptionSearch,
  getTextIn,
  cancelablePromise,
  useSearchHistory
} from '../../common'
import TSA from '../../common/tsa'
import { setLoading } from '../../redux/graphSpinner'
import './populationSearchForm.css'
import { dropdownType } from '../../constants/types'
import SearchHistory from '../SearchHistory'

const YEAR_DATE_FORMAT = 'YYYY'

const months = (year, term) => {
  const start = term === 'FALL' ? `${year}-08-01` : moment(`${year}-01-01`).add(1, 'years')
  return Math.ceil(moment.duration(moment().diff(moment(start))).asMonths())
}

const initialQuery = () => ({
  year: Datetime.moment('2017-01-01').year(),
  semesters: ['FALL', 'SPRING'],
  studentStatuses: [],
  studyRights: {},
  months: months('2017', 'FALL'),
  tag: null
})

const PopulationSearchForm = props => {
  const [totalState, setTotalState] = useState({
    query: initialQuery(),
    isLoading: false,
    momentYear: Datetime.moment('2017-01-01')
  })
  const [didMount, setDidMount] = useState(false)
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('populationSearch', 8)

  const fetchPopulationPromises = useRef()

  const setState = newState => setTotalState({ ...totalState, ...newState })

  const { query, isLoading, momentYear } = totalState

  const { studyProgrammes, location, semesters, queries, history, tags, language, translate, onProgress } = props

  const parseQueryFromUrl = () => {
    const initial = initialQuery()
    const { studyRights, months, ...rest } = qs.parse(location.search)
    const query = {
      ...initial,
      ...rest,
      studyRights: JSON.parse(studyRights),
      months: JSON.parse(months)
    }
    return query
  }

  const checkPreviousQuery = (query, previousQuery) => {
    if (!previousQuery.studyRights) return false

    const sameProgramme = query.studyRights.programme === previousQuery.studyRights.programme
    const sameMonths = query.months === previousQuery.months
    const sameYear = query.Year === previousQuery.Year
    const sameSemesters = previousQuery.semesters
      ? isEqual(previousQuery.semesters, query.semesters)
      : !(query.semesters.length > 0)
    const sameStudentStatuses = previousQuery.studentStatuses
      ? isEqual(query.studentStatuses, previousQuery.studentStatuses)
      : !(query.studentStatuses.length > 0)
    const sameTag = previousQuery.tag !== null ? previousQuery.tag === query.tag : query.tag === null

    return sameProgramme && sameMonths && sameYear && sameSemesters && sameStudentStatuses && sameTag
  }

  const formatQueryParamsToArrays = (query, params) => {
    const res = { ...query }
    params.forEach(p => {
      if (!res[p]) return
      res[p] = Array.isArray(res[p]) ? res[p] : [res[p]]
    })
    return res
  }

  const fetchPopulation = async query => {
    const formattedQueryParams = formatQueryParamsToArrays(query, ['semesters', 'studentStatuses'])
    const queryCodes = Object.values(query.studyRights).filter(e => e != null)
    const uuid = uuidv4()
    const request = { ...formattedQueryParams, studyRights: queryCodes, uuid }
    setState({ isLoading: true })
    props.setLoading()
    props.clearSelected()
    fetchPopulationPromises.current = cancelablePromise(
      Promise.all([
        props.getPopulationStatistics({ ...formattedQueryParams, uuid, onProgress }),
        props.getPopulationCourses(request),
        props.getPopulationFilters(request),
        props.getMandatoryCourses(formattedQueryParams.studyRights.programme),
        props.getTagsByStudytrackAction(query.studyRights.programme)
      ])
    )

    const success = await fetchPopulationPromises.current.promise
    if (success) {
      props.clearPopulationFilters()
      if (query.studyRights.programme === 'KH50_001') {
        props.setPopulationFilter(transferTo(false))
      }
      setState({
        isLoading: false
      })
    }
  }

  const fetchPopulationFromUrlParams = () => {
    const previousQuery = queries
    const query = parseQueryFromUrl()

    if (query.studyRights && query.studyRights.programme) {
      TSA.sendEvent({
        group: 'Programme Usage',
        name: 'populations query',
        label: query.studyRights.programme,
        value: 1
      })
    }

    if (!checkPreviousQuery(query, previousQuery)) {
      setState({ query })
      fetchPopulation(query)
    }
  }

  useEffect(() => {
    if (!studyProgrammes || Object.values(studyProgrammes).length === 0) {
      setState({ query: initialQuery() }) // eslint-disable-line
      props.getDegreesAndProgrammes()
    }
    if (!semesters.years) {
      props.getSemesters()
    }
    if (location.search) {
      fetchPopulationFromUrlParams()
    }
    if (!location.search) {
      setState({
        query: {
          ...query,
          studentStatuses: [],
          semesters: ['FALL', 'SPRING'],
          tag: null
        }
      })
    }
    setDidMount(true)
    return () => {
      if (fetchPopulationPromises.current) fetchPopulationPromises.current.cancel()
      props.clearPopulationFilters()
    }
  }, [location.search])

  const handleClear = type => {
    setState({
      query: {
        ...query,
        studyRights: {
          ...query.studyRights,
          [type]: undefined
        }
      }
    })
  }

  const handleProgrammeChange = (e, { value }) => {
    const programme = value
    props.getTagsByStudytrackAction(value)
    if (programme === '') {
      handleClear('programme')
      return
    }
    setState({
      query: {
        ...query,
        studyRights: {
          programme
        }
      }
    })
  }

  useEffect(() => {
    if (studyProgrammes && Object.values(studyProgrammes).length === 1 && !query.studyRights.programme && didMount) {
      handleProgrammeChange(null, { value: Object.values(studyProgrammes)[0].code })
    }
  })

  const pushQueryToUrl = query => {
    const { studyRights, ...rest } = query
    const queryObject = { ...rest, studyRights: JSON.stringify(studyRights) }
    const searchString = qs.stringify(queryObject)
    history.push({ search: searchString })
  }

  const getSearchHistoryTextFromQuery = () => {
    const { studyRights, semesters, months, year, studentStatuses, tag } = query
    const studyRightsText = `${studyProgrammes[studyRights.programme].name[language]} ${Object.values(studyRights)
      .filter(s => s)
      .join(', ')}`
    const timeText = `${semesters.join(', ')}/${year}-${parseInt(year, 10) + 1}, ${months} months`
    const studentStatusesText =
      studentStatuses.length > 0 ? `includes ${studentStatuses.map(s => s.toLowerCase()).join(', ')} students` : null
    const tagText = !tag ? null : `Tag: ${tags.find(t => t.tag_id === tag).tagname}`

    return [studyRightsText, timeText, studentStatusesText, tagText].filter(t => t).join(' - ')
  }

  const handleSubmit = () => {
    addItemToSearchHistory({
      text: getSearchHistoryTextFromQuery(),
      params: query
    })
    pushQueryToUrl(query)
  }

  const handleYearSelection = momentYear => {
    if (!moment.isMoment(momentYear)) {
      setState({
        momentYear: null,
        query: {
          ...query,
          studyRights: {
            ...query.studyRights,
            studyTrack: null,
            degree: null
          }
        }
      })
      return
    }

    // When changing year, remove degree and track selections
    // if they are no longer possible to select
    let { degree, studyTrack } = query.studyRights
    if (degree || studyTrack) {
      if (!query.studyRights.programme) {
        degree = null
        studyTrack = null
      } else {
        const associations = studyProgrammes[query.studyRights.programme].enrollmentStartYears[momentYear.year()]
        if (!associations) {
          degree = null
          studyTrack = null
        } else {
          if (!associations.degrees[query.studyRights.degree]) {
            degree = null
          }
          if (!associations.studyTracks[query.studyRights.studyTrack]) {
            studyTrack = null
          }
        }
      }
    }
    setState({
      momentYear,
      query: {
        ...query,
        tag: null,
        year: reformatDate(momentYear, YEAR_DATE_FORMAT),
        months: months(
          reformatDate(momentYear, YEAR_DATE_FORMAT),
          query.semesters.includes('FALL') ? 'FALL' : 'SPRING'
        ),
        studyRights: {
          ...query.studyRights,
          studyTrack,
          degree
        }
      }
    })
  }

  const getMonths = (year, end, term) => {
    if (moment.isMoment(end)) {
      const lastDayOfMonth = moment(end).endOf('month')
      const start = term === 'FALL' ? `${year}-08-01` : `${year}-01-01`
      return Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(start))).asMonths())
    }
    return -1
  }

  const addYear = () => {
    const { year } = query
    const nextYear = momentFromFormat(year, YEAR_DATE_FORMAT).add(1, 'year')
    handleYearSelection(nextYear)
  }

  const subtractYear = () => {
    const { year } = query
    const previousYear = momentFromFormat(year, YEAR_DATE_FORMAT).subtract(1, 'year')
    handleYearSelection(previousYear)
  }

  const handleDegreeChange = (e, { value }) => {
    const degree = value
    if (degree === '') {
      handleClear('degree')
      return
    }
    setState({
      query: {
        ...query,
        studyRights: {
          ...query.studyRights,
          degree
        }
      }
    })
  }

  const handleStudyTrackChange = (e, { value }) => {
    const studyTrack = value
    if (studyTrack === '') {
      handleClear('studyTrack')
      return
    }
    setState({
      query: {
        ...query,
        studyRights: {
          ...query.studyRights,
          studyTrack
        }
      }
    })
  }

  const validYearCheck = momentYear => {
    if (!moment.isMoment(momentYear)) {
      return false
    }
    if (!query.studyRights.programme) {
      return momentYear.year() >= 1900 && momentYear.isSameOrBefore(moment().subtract(6, 'months'))
    }
    return props.studyProgrammes[query.studyRights.programme].enrollmentStartYears[momentYear.year()] != null
  }

  const handleTagSelection = (e, { value }) => {
    const tag = tags.find(t => t.tag_id === value)
    if (!tag) {
      setState({
        query: {
          ...query,
          tag: null,
          months: query.months
        }
      })
    } else {
      const months = getMonths(reformatDate(moment(`${tag.year}-01-01`), YEAR_DATE_FORMAT), moment(), 'FALL')
      setState({
        query: {
          ...query,
          tag: tag.tag_id,
          year: tag.year,
          months
        }
      })
    }
  }

  const renderableList = list =>
    list.map(sp => {
      const { type, name, code } = sp
      const shh = { type, name, code }
      shh.text = sp.name[language] || `${sp.name.fi || sp.name.en || sp.name.sv} (translation not found)`
      shh.description = sp.code
      shh.value = sp.code
      return shh
    })

  const renderEnrollmentDateSelector = () => {
    const { year } = query
    return (
      <Form.Group key="year" className="enrollmentSelectorGroup">
        <Form.Field error={!validYearCheck(momentYear)} className="yearSelect">
          <label>Class of</label>
          <Datetime
            className="yearSelectInput"
            control={Datetime}
            dateFormat={YEAR_DATE_FORMAT}
            timeFormat={false}
            renderYear={(p, selectableYear) => (
              <td {...p}>
                {`${selectableYear}`}-<br />
                {`${selectableYear + 1}`}
              </td>
            )}
            closeOnSelect
            value={`${year}-${moment()
              .year(year)
              .add(1, 'years')
              .format('YYYY')}`}
            isValidDate={validYearCheck}
            onChange={handleYearSelection}
          />
        </Form.Field>
        <Form.Field className="yearControl">
          <Button.Group basic vertical className="yearControlButtonGroup">
            <Button type="button" icon="plus" className="yearControlButton" onClick={addYear} tabIndex="-1" />
            <Button type="button" icon="minus" className="yearControlButton" onClick={subtractYear} tabIndex="-1" />
          </Button.Group>
        </Form.Field>
      </Form.Group>
    )
  }

  const renderStudyProgrammeDropdown = (studyRights, programmesToRender) => (
    <Form.Field>
      <label>Study programme</label>
      <Form.Dropdown
        placeholder="Select study programme"
        search={textAndDescriptionSearch}
        selection
        noResultsMessage="No selectable study programmes"
        value={studyRights.programme}
        options={programmesToRender}
        onChange={handleProgrammeChange}
        closeOnChange
        clearable
        fluid
        selectOnBlur={false}
        selectOnNavigation={false}
      />
    </Form.Field>
  )

  const renderTagDropdown = (tagOptions, chosenTag) => (
    <Form.Field>
      <label>Select tag (Optional)</label>
      <Form.Dropdown
        placeholder="select tag"
        selection
        value={chosenTag.tag_id}
        options={tagOptions}
        onChange={handleTagSelection}
        selectOnBlur={false}
        selectOnNavigation={false}
      />
    </Form.Field>
  )

  const renderAdditionalDegreeOrStudyTrackOrTagDropdown = (
    studyRights,
    studyTracksToRender,
    degreesToRender,
    shouldRenderTags,
    tagOptions,
    chosenTag
  ) => {
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
          onChange={handleDegreeChange}
          closeOnChange
          clearable
          selectOnBlur={false}
          selectOnNavigation={false}
        />
      </React.Fragment>
    )
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
          onChange={handleStudyTrackChange}
          closeOnChange
          clearable
          selectOnBlur={false}
          selectOnNavigation={false}
        />
      </React.Fragment>
    )
    if (studyRights.programme) {
      return (
        <Form.Group>
          <Form.Field width={8}>
            {shouldRenderTags ? renderTagDropdown(tagOptions, chosenTag) : null}
            {degreesToRender && degreesToRender.length > 1 ? renderableDegrees() : null}
          </Form.Field>
          <Form.Field width={8}>
            {studyTracksToRender && studyTracksToRender.length > 0 ? renderableTracks() : null}
          </Form.Field>
        </Form.Group>
      )
    }
    return null
  }

  const renderStudyGroupSelector = () => {
    const { studyRights } = query
    if (props.pending || !didMount) {
      return <Icon name="spinner" loading size="big" color="black" style={{ marginLeft: '45%' }} />
    }
    if (Object.values(studyProgrammes).length === 0 && !props.pending) {
      return (
        <Message
          error
          color="red"
          header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi"
        />
      )
    }

    let programmesToRender
    if (Object.values(studyProgrammes).length !== 0) {
      const sortedStudyProgrammes = sortBy(studyProgrammes, s => getTextIn(s.name, language))
      programmesToRender = renderableList(sortedStudyProgrammes)
    }
    let degreesToRender
    let studyTracksToRender
    if (studyRights.programme && validYearCheck(momentYear)) {
      const associations = studyProgrammes[studyRights.programme].enrollmentStartYears[momentYear.year()]
      if (associations) {
        const sortedStudyDegrees = sortBy(associations.degrees, s => getTextIn(s.name, language))
        degreesToRender = renderableList(sortedStudyDegrees)

        const sortedStudyTracks = sortBy(associations.studyTracks, s => getTextIn(s.name, language))
        studyTracksToRender = renderableList(sortedStudyTracks)
      }
    }
    const tagOptions = [{ key: 0, text: '', value: '' }]
    tags.forEach(tag => tagOptions.push({ key: tag.tag_id, text: tag.tagname, value: tag.tag_id }))
    const chosenTag = tags.find(tag => tag.tag_id === query.tag) || { tagname: '', tag_id: '' }
    const shouldRenderTags = tags.filter(tag => tag.studytrack === query.studyRights.programme).length > 0

    return (
      <div>
        {renderStudyProgrammeDropdown(studyRights, programmesToRender)}
        {renderAdditionalDegreeOrStudyTrackOrTagDropdown(
          studyRights,
          studyTracksToRender,
          degreesToRender,
          shouldRenderTags,
          tagOptions,
          chosenTag
        )}
      </div>
    )
  }

  const shouldRenderSearchForm = () => {
    const queryIsEmpty = Object.getOwnPropertyNames(props.queries).length > 0
    return !queryIsEmpty
  }

  if (!shouldRenderSearchForm() && location.search !== '') {
    return null
  }
  let errorText = translate('populationStatistics.alreadyFetched')
  let isQueryInvalid = false

  if (!validYearCheck(momentYear)) {
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
    <div>
      <Form error={isQueryInvalid} loading={isLoading}>
        <Grid divided padded="vertically">
          <Grid.Row>
            <Grid.Column width={10}>
              {renderEnrollmentDateSelector()}
              {renderStudyGroupSelector()}
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Message error color="blue" header={errorText} />
        <Form.Button onClick={handleSubmit} disabled={isQueryInvalid || query.months < 0}>
          {translate('populationStatistics.addPopulation')}
        </Form.Button>
        <SearchHistory items={searchHistory} updateItem={updateItemInSearchHistory} handleSearch={pushQueryToUrl} />
      </Form>
    </div>
  )
}

PopulationSearchForm.propTypes = {
  language: string.isRequired,
  translate: func.isRequired,
  getDegreesAndProgrammes: func.isRequired,
  getPopulationStatistics: func.isRequired,
  getPopulationCourses: func.isRequired,
  getMandatoryCourses: func.isRequired,
  getPopulationFilters: func.isRequired,
  setPopulationFilter: func.isRequired,
  clearPopulationFilters: func.isRequired,
  queries: shape({}).isRequired,
  studyProgrammes: shape({}), //eslint-disable-line
  degrees: arrayOf(dropdownType), //eslint-disable-line
  studyTracks: arrayOf(dropdownType), //eslint-disable-line
  setLoading: func.isRequired,
  pending: bool, //eslint-disable-line
  getSemesters: func.isRequired,
  semesters: shape({}).isRequired,
  history: shape({}).isRequired,
  location: shape({}).isRequired,
  getTagsByStudytrackAction: func.isRequired,
  tags: oneOfType([arrayOf(shape({ tag_id: string, tagname: string })), object]).isRequired,
  onProgress: func.isRequired,
  clearSelected: func.isRequired
}

const mapStateToProps = ({ semesters, settings, populations, populationDegreesAndProgrammes, localize, tags }) => {
  const { language } = settings
  const { pending } = populationDegreesAndProgrammes
  return {
    semesters: semesters.data,
    language,
    queries: populations.query || {},
    translate: getTranslate(localize),
    studyProgrammes: populationDegreesAndProgrammes.data.programmes || {},
    pending,
    tags: tags.data
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    {
      getPopulationStatistics,
      getPopulationCourses,
      getPopulationSelectedStudentCourses,
      getPopulationFilters,
      getMandatoryCourses,
      setPopulationFilter,
      clearPopulationFilters,
      getDegreesAndProgrammes,
      setLoading,
      getSemesters,
      getTagsByStudytrackAction,
      clearSelected
    }
  )(PopulationSearchForm)
)
