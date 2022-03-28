import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import { useLocation, useHistory } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import { useGetSemestersQuery } from 'redux/semesters'
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
  studyTrackFilter,
  programmeFilter,
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
  const [onlyHopsCredits, setOnlyHopsCredits] = useState(false)

  useTitle('Population statistics')

  const { data: allSemesters } = useGetSemestersQuery()

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
      allSemesters: allSemesters?.semesters ?? [],
      language,
    }),
    studyTrackFilter({ code: programmeCode }),
    programmeFilter,
  ]

  if (parseInt(query?.year, 10) >= 2020) {
    filters.push(
      admissionTypeFilter({
        programme: programmeCode,
      })
    )
  }

  const mapStudents = student => {
    const hops = student.studyplans.find(plan => plan.programme_code === programmeCode)
    const courses = new Set(hops ? hops.included_courses : [])

    const hopsCourses = student.courses.filter(course => courses.has(course.course_code))
    const hopsCredits = hopsCourses.reduce((acc, cur) => acc + cur.credits, 0)

    if (!onlyHopsCredits)
      return {
        ...student,
        hopsCredits,
      }

    return {
      ...student,
      courses: hopsCourses,
      hopsCredits,
      credits: hopsCredits,
    }
  }

  return (
    <FilterView
      name="PopulationStatistics"
      filters={filters}
      students={students.map(mapStudents) ?? []}
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
            <PopulationSearch
              history={history}
              location={location}
              onlyHopsCredits={onlyHopsCredits}
              setOnlyHopsCredits={setOnlyHopsCredits}
            />
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
