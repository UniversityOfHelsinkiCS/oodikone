import { isEqual, sortBy } from 'lodash'
import moment from 'moment'
import qs from 'query-string'
import { useEffect, useRef, useState } from 'react'
import Datetime from 'react-datetime'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { Button, Form, Grid, Icon, Message } from 'semantic-ui-react'

import { cancelablePromise, createPinnedFirstComparator, isNewStudyProgramme, textAndDescriptionSearch } from '@/common'
import { useSearchHistory } from '@/common/hooks'
import { FilterOldProgrammesToggle } from '@/components/common/FilterOldProgrammesToggle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SearchHistory } from '@/components/SearchHistory'
import { YEAR_DATE_FORMAT } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { getPopulationStatistics, clearPopulations, useGetProgrammesQuery } from '@/redux/populations'
import { clearSelected } from '@/redux/populationSelectedStudentCourses'
import { useGetStudyProgrammePinsQuery } from '@/redux/studyProgrammePins'
import { formatQueryParamsToArrays } from '@/shared/util'
import { momentFromFormat, reformatDate } from '@/util/timeAndDate'
import { getMonths } from './common'
import './populationSearch.css'

const initialQuery = () => ({
  year: '2017',
  semesters: ['FALL', 'SPRING'],
  studentStatuses: [],
  studyRights: {},
  months: getMonths('2017', 'FALL'),
})

export const PopulationSearchForm = ({ onProgress }) => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch()
  const populations = useSelector(state => state.populations)
  const queries = populations.query || {}
  const { getTextIn } = useLanguage()
  const { fullAccessToStudentData } = useGetAuthorizedUserQuery()
  const [totalState, setTotalState] = useState({
    query: initialQuery(),
    isLoading: false,
    momentYear: Datetime.moment('2017-01-01'),
  })
  const [didMount, setDidMount] = useState(false)
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('populationSearch', 8)
  const [filterProgrammes, setFilterProgrammes] = useState(fullAccessToStudentData)
  const fetchPopulationPromises = useRef()
  const { data: programmes = {}, isLoading: programmesAreLoading } = useGetProgrammesQuery()
  const studyProgrammes =
    (programmes.KH90_001 || programmes.MH90_001) && !Object.keys(programmes).includes('KH90_001+MH90_001')
      ? {
          ...programmes,
          'KH90_001+MH90_001': {
            ...programmes.KH90_001,
            code: 'KH90_001+MH90_001',
            name: {
              fi: 'Eläinlääketieteen kandiohjelma ja lisensiaatin koulutusohjelma',
              en: "Bachelor's and Degree Programme in Vetenary Medicine",
              sv: 'Kandidats- och Utbildningsprogrammet i veterinärmedicin',
            },
          },
        }
      : programmes
  const studyProgrammePins = useGetStudyProgrammePinsQuery().data
  const pinnedProgrammes = studyProgrammePins?.studyProgrammes || []

  const setState = newState => setTotalState({ ...totalState, ...newState })

  const { query, isLoading } = totalState

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
    const sameMonths = query.months === previousQuery.months
    const sameYear = query.year === previousQuery.year
    const sameSemesters = isEqual(previousQuery.semesters, query.semesters)
    const sameStudentStatuses = isEqual(previousQuery.studentStatuses, query.studentStatuses)
    const sameYears = isEqual(previousQuery.years, query.years)
    const sameStudyrights = isEqual(previousQuery.studyRights, query.studyRights)
    const sameTag = previousQuery.tag === query.tag

    return sameStudyrights && sameMonths && sameYear && sameSemesters && sameStudentStatuses && sameYears && sameTag
  }

  const fetchPopulation = async query => {
    const formattedQueryParams = formatQueryParamsToArrays(query, ['semesters', 'studentStatuses', 'years'])
    const uuid = crypto.randomUUID()
    setState({ isLoading: true })
    dispatch(clearSelected())
    fetchPopulationPromises.current = cancelablePromise(
      Promise.all([dispatch(getPopulationStatistics({ ...formattedQueryParams, uuid, onProgress }), [])])
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

  const handleProgrammeChange = (_event, { value }) => {
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
    if (!checkPreviousQuery(query, queries)) {
      dispatch(clearPopulations())
    }
    // Just to be sure that the previous population's data has been cleared
    setTimeout(() => {
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
    }, 0)
  }

  const getSearchHistoryTextFromQuery = () => {
    const { studyRights, semesters, months, year, studentStatuses } = query
    const studyRightsText = `${getTextIn(studyProgrammes[studyRights.programme].name)} ${Object.values(studyRights)
      .filter(studyright => studyright)
      .join(', ')}`
    const timeText = `${semesters.join(', ')}/${year}-${parseInt(year, 10) + 1}, ${months} months`
    const studentStatusesText =
      studentStatuses.length > 0
        ? `includes ${studentStatuses.map(status => status.toLowerCase()).join(', ')} students`
        : null

    return [studyRightsText, timeText, studentStatusesText].filter(text => text).join(' - ')
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
        months: getMonths(
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

  const renderableList = list =>
    list.map(({ code, name }) => ({
      code,
      description: code,
      icon: pinnedProgrammes.includes(code) ? 'pin' : '',
      name,
      text: getTextIn(name),
      value: code,
    }))

  const renderEnrollmentDateSelector = () => {
    const { year } = query
    const currentYear = moment().year()
    return (
      <Form.Group className="enrollmentSelectorGroup" key="year">
        <Form.Field className="yearSelect">
          <label>Class of</label>
          <Datetime
            className="yearSelectInput"
            closeOnSelect
            control={Datetime}
            dateFormat={YEAR_DATE_FORMAT}
            onChange={handleYearSelection}
            renderInput={dateInputProps => (
              <input
                {...dateInputProps}
                value={`${year}-${moment().year(year).add(1, 'years').format(YEAR_DATE_FORMAT)}`}
              />
            )}
            renderYear={({ key, ...otherProps }, selectableYear) =>
              selectableYear <= currentYear &&
              selectableYear >= 1900 && (
                <td key={key} {...otherProps}>
                  {`${selectableYear}`}-<br />
                  {`${selectableYear + 1}`}
                </td>
              )
            }
            timeFormat={false}
          />
        </Form.Field>
        <Form.Field className="yearControl">
          <Button.Group basic className="yearControlButtonGroup" vertical>
            <Button className="yearControlButton" icon="plus" onClick={addYear} tabIndex="-1" type="button" />
            <Button className="yearControlButton" icon="minus" onClick={subtractYear} tabIndex="-1" type="button" />
          </Button.Group>
        </Form.Field>
        <Form.Field>
          {fullAccessToStudentData && (
            <FilterOldProgrammesToggle
              checked={filterProgrammes}
              onChange={() => setFilterProgrammes(!filterProgrammes)}
            />
          )}
        </Form.Field>
      </Form.Group>
    )
  }

  const renderStudyProgrammeDropdown = (studyRights, programmesToRender) => (
    <Form.Field>
      <label>Study programme</label>
      <Form.Dropdown
        clearable
        closeOnChange
        data-cy="select-study-programme"
        fluid
        noResultsMessage="No selectable study programmes"
        onChange={handleProgrammeChange}
        options={programmesToRender}
        placeholder="Select study programme"
        search={textAndDescriptionSearch}
        selectOnBlur={false}
        selectOnNavigation={false}
        selection
        value={studyRights.programme}
      />
    </Form.Field>
  )

  const renderStudyProgrammeSelector = () => {
    const { studyRights } = query
    if (programmesAreLoading || !didMount) {
      return <Icon color="black" loading name="spinner" size="big" style={{ marginLeft: '45%' }} />
    }
    if (Object.values(studyProgrammes).length === 0 && !programmesAreLoading) {
      return (
        <Message
          color="red"
          error
          header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi"
        />
      )
    }

    let programmesToRender
    if (Object.values(studyProgrammes).length !== 0) {
      let sortedStudyProgrammes = sortBy(studyProgrammes, programme => getTextIn(programme.name))
      if (filterProgrammes) {
        sortedStudyProgrammes = sortedStudyProgrammes.filter(programme => isNewStudyProgramme(programme.code))
      }
      programmesToRender = renderableList(sortedStudyProgrammes)
    }
    const pinnedFirstComparator = createPinnedFirstComparator(pinnedProgrammes)

    return <div>{renderStudyProgrammeDropdown(studyRights, programmesToRender.sort(pinnedFirstComparator))}</div>
  }

  const shouldRenderSearchForm = () => {
    const queryIsEmpty = Object.getOwnPropertyNames(queries).length > 0
    return !queryIsEmpty
  }

  if (!shouldRenderSearchForm() && location.search !== '') {
    return null
  }

  let invalidQuery = false
  let errorMessage = 'Selected population already in analysis'

  if (query.semesters.length === 0) {
    invalidQuery = true
    errorMessage = 'Select at least one semester'
  }

  if (!query.studyRights.programme) {
    invalidQuery = true
    errorMessage = 'Select study programme'
  }

  return (
    <Form error={invalidQuery} loading={isLoading}>
      <Grid divided padded="vertically">
        <Grid.Row>
          <Grid.Column width={10}>
            {renderEnrollmentDateSelector()}
            {renderStudyProgrammeSelector()}
            <Message color="blue" error header={errorMessage} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Form.Button color="blue" disabled={invalidQuery || query.months < 0} onClick={handleSubmit}>
        See class
      </Form.Button>
      <SearchHistory
        handleSearch={pushQueryToUrl}
        items={searchHistory.map(item => {
          item.date = new Date(item.date)
          return item
        })}
        updateItem={updateItemInSearchHistory}
      />
    </Form>
  )
}
