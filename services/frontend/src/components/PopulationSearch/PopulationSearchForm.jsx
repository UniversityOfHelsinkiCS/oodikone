import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import qs from 'query-string'
import { Form, Button, Message, Icon, Grid, Radio } from 'semantic-ui-react'
import { v4 as uuidv4 } from 'uuid'
import Datetime from 'react-datetime'
import { sortBy, isEqual } from 'lodash'
import moment from 'moment'

import { useGetAuthorizedUserQuery } from 'redux/auth'
import { getPopulationStatistics, clearPopulations } from 'redux/populations'
import { clearSelected } from 'redux/populationSelectedStudentCourses'
import { getProgrammes } from 'redux/populationProgrammes'
import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { momentFromFormat, reformatDate, textAndDescriptionSearch, cancelablePromise } from 'common'
import { useSearchHistory } from 'common/hooks'
import './populationSearch.css'
import { SearchHistory } from '../SearchHistory'

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
})

const PopulationSearchForm = ({
  studyProgrammes,
  queries,
  language,
  onProgress,
  clearSelected,
  getPopulationStatistics,
  getProgrammes,
  clearPopulations,
  pending,
}) => {
  const history = useHistory()
  const location = useLocation()
  const { isAdmin } = useGetAuthorizedUserQuery()
  const { getTextIn } = useLanguage()
  const [totalState, setTotalState] = useState({
    query: initialQuery(),
    isLoading: false,
    momentYear: Datetime.moment('2017-01-01'),
  })
  const [didMount, setDidMount] = useState(false)
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('populationSearch', 8)
  const [filterProgrammes, setFilterProgrammes] = useState(isAdmin)
  const fetchPopulationPromises = useRef()

  const setState = newState => setTotalState({ ...totalState, ...newState })

  const { query, isLoading, momentYear } = totalState

  if (
    (studyProgrammes.KH90_001 || studyProgrammes.MH90_001) &&
    !Object.keys(studyProgrammes).includes('KH90_001+MH90_001')
  ) {
    const vetenaryCombined = { ...studyProgrammes.KH90_001 }
    vetenaryCombined.name = {
      fi: 'Eläinlääketieteen kandiohjelma ja lisensiaatin koulutusohjelma',
      en: "Bachelor's and Degree Programme in Vetenary Medicine",
      sv: 'Kandidats- och Utbildningsprogrammet i veterinärmedicin',
    }
    vetenaryCombined.code = 'KH90_001+MH90_001'
    studyProgrammes['KH90_001+MH90_001'] = vetenaryCombined
  }

  const parseQueryFromUrl = () => {
    const initial = initialQuery()
    const { studyRights, months, ...rest } = qs.parse(location.search)
    const query = {
      ...initial,
      ...rest,
      studyRights: JSON.parse(studyRights),
      months: JSON.parse(months),
    }
    return query
  }

  const checkPreviousQuery = (query, previousQuery) => {
    if (!previousQuery.studyRights) return false
    const sameMonths = query.months === previousQuery.months
    const sameYear = query.Year === previousQuery.Year
    const sameSemesters = previousQuery.semesters
      ? isEqual(previousQuery.semesters, query.semesters)
      : !(query.semesters.length > 0)
    const studentStatusesArray =
      typeof query.studentStatuses === 'string' ? [query.studentStatuses] : query.studentStatuses
    const sameStudentStatuses = previousQuery.studentStatuses
      ? isEqual(studentStatusesArray, previousQuery.studentStatuses)
      : !(query.studentStatuses.length > 0)
    const sameYears = previousQuery.years ? isEqual(previousQuery.years, query.years) : !query.years
    const sameStudyrights = previousQuery.studyRights
      ? isEqual(previousQuery.studyRights, query.studyRights)
      : !query.studyRights

    return sameStudyrights && sameMonths && sameYear && sameSemesters && sameStudentStatuses && sameYears
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
    const formattedQueryParams = formatQueryParamsToArrays(query, ['semesters', 'studentStatuses', 'years'])
    const uuid = uuidv4()
    setState({ isLoading: true })
    clearSelected()
    fetchPopulationPromises.current = cancelablePromise(
      Promise.all([getPopulationStatistics({ ...formattedQueryParams, uuid, onProgress }), []])
    )
    const success = await fetchPopulationPromises.current.promise
    if (success) {
      setState({
        isLoading: false,
      })
    }
  }

  const fetchPopulationFromUrlParams = () => {
    const previousQuery = queries
    const query = parseQueryFromUrl()
    const formattedQuery = formatQueryParamsToArrays(query, ['semesters', 'studentStatuses', 'years'])
    if (!checkPreviousQuery(formattedQuery, previousQuery)) {
      setState({ query })
      fetchPopulation(query)
    }
  }

  useEffect(() => {
    if (!studyProgrammes || Object.values(studyProgrammes).length === 0) {
      setState({ query: initialQuery() })
      getProgrammes()
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
        },
      })
    }
    setDidMount(true)
    return () => {
      if (fetchPopulationPromises.current) fetchPopulationPromises.current.cancel()
    }
  }, [location.search])

  const handleClear = type => {
    setState({
      query: {
        ...query,
        studyRights: {
          ...query.studyRights,
          [type]: undefined,
        },
      },
    })
  }

  const handleProgrammeChange = (_e, { value }) => {
    const programme = value
    if (programme === '') {
      handleClear('programme')
      return
    }
    setState({
      query: {
        ...query,
        studyRights: {
          programme,
        },
      },
    })
  }

  useEffect(() => {
    if (studyProgrammes && Object.values(studyProgrammes).length === 1 && !query.studyRights.programme && didMount) {
      handleProgrammeChange(null, { value: Object.values(studyProgrammes)[0].code })
    }
  })

  const pushQueryToUrl = query => {
    if (!checkPreviousQuery(query, queries)) clearPopulations()
    // Just to be sure that the previous population's data has been cleared
    setImmediate(() => {
      const { studyRights, ...rest } = query
      studyRights.combinedProgramme =
        studyRights.programme && studyRights.programme.includes('+') ? studyRights.programme.split('+')[1] : ''
      studyRights.programme =
        studyRights.programme && studyRights.programme.includes('+')
          ? studyRights.programme.split('+')[0]
          : studyRights.programme
      const queryObject = { ...rest, studyRights: JSON.stringify(studyRights) }
      const searchString = qs.stringify(queryObject)
      history.push({ search: searchString })
    })
  }

  const getSearchHistoryTextFromQuery = () => {
    const { studyRights, semesters, months, year, studentStatuses } = query
    const studyRightsText = `${getTextIn(studyProgrammes[studyRights.programme].name)} ${Object.values(studyRights)
      .filter(s => s)
      .join(', ')}`
    const timeText = `${semesters.join(', ')}/${year}-${parseInt(year, 10) + 1}, ${months} months`
    const studentStatusesText =
      studentStatuses.length > 0 ? `includes ${studentStatuses.map(s => s.toLowerCase()).join(', ')} students` : null

    return [studyRightsText, timeText, studentStatusesText].filter(t => t).join(' - ')
  }

  const handleSubmit = () => {
    addItemToSearchHistory({
      text: getSearchHistoryTextFromQuery(),
      params: query,
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
          },
        },
      })
      return
    }

    // When changing year, remove track selection, if it is no longer possible to select
    let { studyTrack } = query.studyRights
    if (studyTrack) {
      if (!query.studyRights.programme) {
        studyTrack = null
      } else {
        const associations = studyProgrammes[query.studyRights.programme].enrollmentStartYears[momentYear.year()]
        if (!associations) {
          studyTrack = null
        } else if (!associations.studyTracks[query.studyRights.studyTrack]) {
          studyTrack = null
        }
      }
    }

    setState({
      momentYear,
      query: {
        ...query,
        year: reformatDate(momentYear, YEAR_DATE_FORMAT),
        months: months(
          reformatDate(momentYear, YEAR_DATE_FORMAT),
          query.semesters.includes('FALL') ? 'FALL' : 'SPRING'
        ),
        studyRights: {
          ...query.studyRights,
          studyTrack,
        },
      },
    })
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

  const validYearCheck = momentYear => {
    if (!moment.isMoment(momentYear)) {
      return false
    }
    if (!query.studyRights.programme) {
      return momentYear.year() >= 1900 && momentYear.isSameOrBefore(moment().subtract(6, 'months'))
    }

    return studyProgrammes[query.studyRights.programme].enrollmentStartYears[momentYear.year()] != null
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
    const currentYear = moment().year()
    return (
      <Form.Group key="year" className="enrollmentSelectorGroup">
        <Form.Field error={!validYearCheck(momentYear)} className="yearSelect">
          <label>Class of</label>
          <Datetime
            className="yearSelectInput"
            control={Datetime}
            dateFormat={YEAR_DATE_FORMAT}
            timeFormat={false}
            renderYear={(p, selectableYear) =>
              selectableYear <= currentYear && selectableYear >= 1900 ? (
                <td {...p}>
                  {`${selectableYear}`}-<br />
                  {`${selectableYear + 1}`}
                </td>
              ) : null
            }
            closeOnSelect
            renderInput={dateInputProps => (
              <input {...dateInputProps} value={`${year}-${moment().year(year).add(1, 'years').format('YYYY')}`} />
            )}
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
        <Form.Field>
          <div>
            {isAdmin && (
              <Radio
                data-cy="toggleFilterProgrammes"
                toggle
                label="Filter out old and specialized programmes"
                checked={filterProgrammes}
                onChange={() => setFilterProgrammes(!filterProgrammes)}
              />
            )}
          </div>
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
        data-cy="select-study-programme"
      />
    </Form.Field>
  )

  const renderStudyGroupSelector = () => {
    const { studyRights } = query
    if (pending || !didMount) {
      return <Icon name="spinner" loading size="big" color="black" style={{ marginLeft: '45%' }} />
    }
    if (Object.values(studyProgrammes).length === 0 && !pending) {
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
      let sortedStudyProgrammes = sortBy(studyProgrammes, s => getTextIn(s.name))
      if (filterProgrammes) {
        sortedStudyProgrammes = sortedStudyProgrammes.filter(
          programme => programme.code.slice(0, 2) === 'MH' || programme.code.slice(0, 2) === 'KH'
        )
      }
      programmesToRender = renderableList(sortedStudyProgrammes)
    }

    return <div>{renderStudyProgrammeDropdown(studyRights, programmesToRender)}</div>
  }

  const shouldRenderSearchForm = () => {
    const queryIsEmpty = Object.getOwnPropertyNames(queries).length > 0
    return !queryIsEmpty
  }

  if (!shouldRenderSearchForm() && location.search !== '') {
    return null
  }
  let errorText = 'Selected population already in analysis'
  let isQueryInvalid = false

  if (!validYearCheck(momentYear)) {
    isQueryInvalid = true
    errorText = 'Select a valid year'
  }

  if (query.semesters.length === 0) {
    isQueryInvalid = true
    errorText = 'Select at least one semester'
  }

  if (!query.studyRights.programme) {
    isQueryInvalid = true
    errorText = 'Select studyprogramme'
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
        <Form.Button color="blue" onClick={handleSubmit} disabled={isQueryInvalid || query.months < 0}>
          See class
        </Form.Button>
        <SearchHistory
          items={searchHistory.map(item => {
            item.date = new Date(item.date)
            return item
          })}
          updateItem={updateItemInSearchHistory}
          handleSearch={pushQueryToUrl}
        />
      </Form>
    </div>
  )
}

const mapStateToProps = ({ settings, populations, populationProgrammes }) => {
  const { language } = settings
  const { pending } = populationProgrammes
  return {
    language,
    queries: populations.query || {},
    studyProgrammes: populationProgrammes.data.programmes || {},
    pending,
  }
}

export const ConnectedPopulationSearchForm = connect(mapStateToProps, {
  getPopulationStatistics,
  getProgrammes,
  clearSelected,
  clearPopulations,
})(PopulationSearchForm)
