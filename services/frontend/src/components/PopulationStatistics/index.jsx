import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import { useLocation, useHistory } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import PopulationDetails from '../PopulationDetails'
import { useLanguage, useTitle } from '../../common/hooks'
import selectors from '../../selectors/populationDetails'
import FilterTray from '../FilterTray'
import { FilterView } from '../FilterTray/useFilters'
import PopulationSearch from '../PopulationSearch'
import DataExport from './DataExport'
import {
  ageFilter,
  courseFilter,
  creditsEarnedFilter,
  genderFilter,
  graduatedFromProgrammeFilter,
  transferredToProgrammeFilter,
  startYearAtUniFilter,
  admissionTypeFilter,
  tagsFilter,
  creditDateFilter,
  enrollmentStatusFilter,
} from '../FilterTray/filters'

const selectPopulations = createSelector(
  ({ populations }) => populations,
  populations => ({
    query: populations.query ?? {},
    queryIsSet: !!populations.query,
    isLoading: populations.pending === true,
    students: populations.data.students ?? [],
  })
)

const PopulationStatistics = () => {
  const location = useLocation()
  const language = useLanguage()
  const history = useHistory()
  const { samples } = useSelector(selectors.makePopulationsToData)
  const { query, queryIsSet, isLoading, students } = useSelector(selectPopulations)
  const courses = useSelector(store => store.populationCourses.data?.coursestatistics)
  const allSemesters = useSelector(store => store.semesters.data?.semesters)

  useTitle('Population statistics')

  const programmeCode = query?.studyRights?.programme

  const filters = [
    genderFilter,
    ageFilter,
    courseFilter(courses),
    creditsEarnedFilter,
    graduatedFromProgrammeFilter(programmeCode),
    transferredToProgrammeFilter,
    startYearAtUniFilter,
    tagsFilter,
    creditDateFilter,
    enrollmentStatusFilter(allSemesters ?? [], language),
  ]

  if (parseInt(query?.year, 10) >= 2020) {
    filters.push(admissionTypeFilter(programmeCode))
  }

  return (
    <FilterView name="PopulationStatistics" filters={filters} students={students}>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <FilterTray visible={location.search !== ''} />
        <div className="segmentContainer" style={{ flexGrow: 1 }}>
          <Header className="segmentTitle" size="large">
            Population statistics
          </Header>
          <Segment className="contentSegment">
            <PopulationSearch history={history} location={location} />
            {location.search !== '' ? (
              <PopulationDetails
                queryIsSet={queryIsSet}
                query={query}
                samples={samples}
                isLoading={isLoading}
                dataExport={<DataExport />}
              />
            ) : null}
          </Segment>
        </div>
      </div>
    </FilterView>
  )
}

export default PopulationStatistics
