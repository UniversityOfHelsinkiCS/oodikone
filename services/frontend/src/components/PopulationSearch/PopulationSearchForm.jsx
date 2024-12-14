import { isEqual, sortBy } from 'lodash'
import moment from 'moment'
import qs from 'query-string'
import { useEffect, useState } from 'react'
import Datetime from 'react-datetime'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router'
import { Button, Form, Message, Radio } from 'semantic-ui-react'

import { createPinnedFirstComparator, isNewStudyProgramme, textAndDescriptionSearch } from '@/common'
import { useSearchHistory } from '@/common/hooks'
import { FilterOldProgrammesToggle } from '@/components/common/FilterOldProgrammesToggle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SearchHistory } from '@/components/SearchHistory'
import { YEAR_DATE_FORMAT } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { getPopulationStatistics, clearPopulations, useGetProgrammesQuery } from '@/redux/populations'
import { clearSelected } from '@/redux/populationSelectedStudentCourses'
import { useGetStudyTracksQuery } from '@/redux/studyProgramme'
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
  showFullStudyPath: false,
})

export const PopulationSearchForm = ({ onProgress }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const populations = useSelector(state => state.populations)
  const previousQuery = populations.query || {}
  const { getTextIn } = useLanguage()
  const { fullAccessToStudentData, isAdmin } = useGetAuthorizedUserQuery()
  const [query, setQuery] = useState(initialQuery())
  const [showFullStudyPath, setShowFullStudyPath] = useState(false)
  const [searchHistory, addItemToSearchHistory, updateItemInSearchHistory] = useSearchHistory('populationSearch', 8)
  const [filterProgrammes, setFilterProgrammes] = useState(fullAccessToStudentData)
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
  const { data: studyTracks = {}, isLoading: studyTracksAreLoading } = useGetStudyTracksQuery(
    { id: query.studyRights.programme },
    { skip: query.studyRights.programme == null }
  )
  const { data: studyProgrammePins } = useGetStudyProgrammePinsQuery()
  const pinnedProgrammes = studyProgrammePins?.studyProgrammes || []

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
    const sameStudyRights = isEqual(previousQuery.studyRights, query.studyRights)
    const sameTag = query.tag === previousQuery.tag
    return sameStudyRights && sameMonths && sameYear && sameSemesters && sameStudentStatuses && sameYears && sameTag
  }

  const fetchPopulation = async query => {
    const formattedQueryParams = formatQueryParamsToArrays(query, ['semesters', 'studentStatuses', 'years'])
    const uuid = crypto.randomUUID()
    dispatch(clearSelected())
    dispatch(getPopulationStatistics({ ...formattedQueryParams, uuid, onProgress }))
  }

  const fetchPopulationFromUrlParams = () => {
    const query = parseQueryFromUrl()
    const formattedQuery = formatQueryParamsToArrays(query, ['semesters', 'studentStatuses', 'years'])
    if (!checkPreviousQuery(formattedQuery, previousQuery)) {
      setQuery(query)
      fetchPopulation(query)
    }
  }

  useEffect(() => {
    if (!studyProgrammes || Object.values(studyProgrammes).length === 0) {
      setQuery(initialQuery())
    }
    if (location.search) {
      fetchPopulationFromUrlParams()
    }
    if (!location.search) {
      setQuery({
        ...query,
        studentStatuses: [],
        semesters: ['FALL', 'SPRING'],
      })
    }
  }, [location.search])

  const handleProgrammeChange = (_event, { value: programme }) => {
    setQuery({
      ...query,
      studyRights:
        programme === ''
          ? { ...query.studyRights, studyTrack: undefined, programme: undefined }
          : { ...query.studyRights, studyTrack: undefined, programme },
    })
  }

  const handleStudyTrackChange = (_event, { value: studyTrack }) => {
    setQuery({
      ...query,
      studyRights:
        studyTrack === '' ? { ...query.studyRights, studyTrack: undefined } : { ...query.studyRights, studyTrack },
    })
  }

  useEffect(() => {
    if (studyProgrammes && Object.values(studyProgrammes).length === 1 && !query.studyRights.programme) {
      handleProgrammeChange(null, { value: Object.values(studyProgrammes)[0].code })
    }
  }, [])

  const pushQueryToUrl = query => {
    if (!checkPreviousQuery(query, previousQuery)) {
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
      navigate({ search: searchString })
    }, 0)
  }

  const getSearchHistoryTextFromQuery = () => {
    const { studyRights, semesters, months, year, studentStatuses } = query
    const studyRightsText = `${getTextIn(studyProgrammes[studyRights.programme].name)} ${Object.values(studyRights)
      .filter(studyRight => studyRight)
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
      return
    }

    setQuery({
      ...query,
      year: reformatDate(momentYear, YEAR_DATE_FORMAT),
      months: getMonths(
        reformatDate(momentYear, YEAR_DATE_FORMAT),
        query.semesters.includes('FALL') ? 'FALL' : 'SPRING'
      ),
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
            <Button
              className="yearControlButton"
              disabled={currentYear <= parseInt(year, 10)}
              icon="plus"
              onClick={addYear}
              tabIndex="-1"
              type="button"
            />
            <Button
              className="yearControlButton"
              disabled={parseInt(year, 10) <= 1900}
              icon="minus"
              onClick={subtractYear}
              tabIndex="-1"
              type="button"
            />
          </Button.Group>
        </Form.Field>
        <Form.Field>
          {fullAccessToStudentData && (
            <div style={{ marginTop: '20px' }}>
              <FilterOldProgrammesToggle
                checked={filterProgrammes}
                onChange={() => setFilterProgrammes(!filterProgrammes)}
              />
            </div>
          )}
        </Form.Field>
      </Form.Group>
    )
  }

  const renderStudyProgrammeSelector = () => {
    if (Object.values(studyProgrammes).length === 0 && !programmesAreLoading) {
      return (
        <Message
          color="red"
          error
          header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi"
        />
      )
    }

    const studyProgrammesAvailable = Object.values(studyProgrammes).length > 0 && !programmesAreLoading
    const programmesToRender = studyProgrammesAvailable
      ? sortBy(studyProgrammes, programme => getTextIn(programme.name))
          .filter(programme => !filterProgrammes || isNewStudyProgramme(programme.code))
          .map(({ code, name }) => ({
            code,
            description: code,
            icon: pinnedProgrammes.includes(code) ? 'pin' : '',
            name,
            text: getTextIn(name),
            value: code,
          }))
      : []
    const pinnedFirstComparator = createPinnedFirstComparator(pinnedProgrammes)

    return (
      <Form.Field>
        <label>Study programme</label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ flexGrow: 1 }}>
            <Form.Dropdown
              clearable
              closeOnChange
              data-cy="select-study-programme"
              disabled={!studyProgrammesAvailable}
              fluid
              noResultsMessage="No selectable study programmes"
              onChange={handleProgrammeChange}
              options={programmesToRender.sort(pinnedFirstComparator)}
              placeholder="Select study programme"
              search={textAndDescriptionSearch}
              selectOnBlur={false}
              selectOnNavigation={false}
              selection
              value={query.studyRights.programme}
            />
          </div>
          {isAdmin && (
            <Radio
              checked={showFullStudyPath}
              label="Show full study path"
              onChange={() => {
                setQuery({ ...query, showFullStudyPath: !showFullStudyPath })
                setShowFullStudyPath(!showFullStudyPath)
              }}
              toggle
            />
          )}
        </div>
      </Form.Field>
    )
  }

  const renderStudyTrackSelector = () => {
    const studyTracksAvailable = Object.values(studyTracks).length > 1 && !studyTracksAreLoading
    const studyTracksToRender = studyTracksAvailable
      ? sortBy(
          Object.keys(studyTracks)
            .filter(studyTrack => studyTrack !== query.studyRights.programme)
            .map(studyTrack => ({
              code: studyTrack,
              description: studyTrack,
              icon: null,
              text: getTextIn(studyTracks[studyTrack]),
              value: studyTrack,
            })),
          'text'
        )
      : []

    return (
      <Form.Field>
        <label>Study track (optional)</label>
        <Form.Dropdown
          clearable
          closeOnChange
          data-cy="select-study-track"
          disabled={!studyTracksAvailable}
          fluid
          noResultsMessage="No selectable study tracks"
          onChange={handleStudyTrackChange}
          options={studyTracksToRender}
          placeholder={studyTracksAvailable ? 'Select study track' : 'No study tracks available for this programme'}
          search={textAndDescriptionSearch}
          selectOnBlur={false}
          selectOnNavigation={false}
          selection
          value={query.studyRights.studyTrack}
        />
      </Form.Field>
    )
  }

  if (location.search !== '') {
    return null
  }

  const invalidQuery = !query.studyRights.programme

  return (
    <Form error={invalidQuery}>
      {renderEnrollmentDateSelector()}
      {renderStudyProgrammeSelector()}
      {renderStudyTrackSelector()}
      <Form.Button color="blue" disabled={invalidQuery} onClick={handleSubmit}>
        See class
      </Form.Button>
      <SearchHistory handleSearch={pushQueryToUrl} items={searchHistory} updateItem={updateItemInSearchHistory} />
    </Form>
  )
}
