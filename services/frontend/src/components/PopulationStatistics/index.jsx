import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import { useLocation, useHistory } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import PopulationDetails from '../PopulationDetails'
import { useLanguage, useTitle } from '../../common/hooks'
import FilterView from '../FilterView'
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
} from '../FilterView/filters'

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
  const { query, queryIsSet, isLoading, students } = useSelector(selectPopulations)
  const courses = useSelector(store => store.populationCourses.data?.coursestatistics)
  const allSemesters = useSelector(store => store.semesters.data?.semesters)

  useTitle('Population statistics')

  const programmeCode = query?.studyRights?.programme

  const filters = [
    genderFilter,
    ageFilter,
    courseFilter({ courses }),
    creditsEarnedFilter,
    graduatedFromProgrammeFilter({ code: programmeCode }),
    transferredToProgrammeFilter,
    startYearAtUniFilter,
    tagsFilter,
    creditDateFilter,
    enrollmentStatusFilter({
      allSemesters: allSemesters ?? [],
      language,
    }),
  ]

  if (parseInt(query?.year, 10) >= 2020) {
    filters.push(
      admissionTypeFilter({
        programme: programmeCode,
      })
    )
  }

  return (
    <FilterView
      name="PopulationStatistics"
      filters={filters}
      students={students ?? []}
      displayTray={location.search !== ''}
      initialOptions={{
        [transferredToProgrammeFilter.key]: {
          transferred: false,
        },
      }}
    >
      {filteredStudents => (
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
                isLoading={isLoading}
                dataExport={<DataExport students={filteredStudents} />}
                allStudents={students}
                filteredStudents={filteredStudents}
              />
            ) : null}
          </Segment>
        </div>
      )}
    </FilterView>
  )
}

export default PopulationStatistics
