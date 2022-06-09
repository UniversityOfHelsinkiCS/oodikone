import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useHistory } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import { useGetSemestersQuery } from 'redux/semesters'
import populationToData from 'selectors/populationDetails'
import { getStudentTotalCredits } from 'common'
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
  studyrightStatusFilter,
  cherrypickFilter,
  hopsFilter,
} from '../FilterView/filters'

const PopulationStatistics = () => {
  const location = useLocation()
  const language = useLanguage()
  const history = useHistory()
  // const { query, queryIsSet, isLoading, students } = useSelector(selectPopulations)
  const courses = useSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  const { query, queryIsSet, isLoading, selectedStudentsByYear, samples } = useSelector(
    populationToData.makePopulationsToData
  )

  useTitle('Population statistics')

  const { data: allSemesters } = useGetSemestersQuery()

  const programmeCode = query?.studyRights?.programme

  const filters = [
    cherrypickFilter,
    hopsFilter({ programmeCode }),
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
    studyrightStatusFilter({ code: programmeCode }),
  ]

  if (parseInt(query?.year, 10) >= 2020) {
    filters.push(
      admissionTypeFilter({
        programme: programmeCode,
      })
    )
  }

  const students = useMemo(() => {
    if (!samples) {
      return []
    }

    return samples.map(student => {
      const hopsCredits = student.studyplans.find(plan => plan.programme_code === programmeCode)?.completed_credits ?? 0
      const credits = getStudentTotalCredits(student)
      return {
        ...student,
        allCredits: student.credits,
        hopsCredits,
        credits,
      }
    })
  }, [samples, programmeCode])

  return (
    <FilterView
      name="PopulationStatistics"
      filters={filters}
      students={students}
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
                allStudents={samples}
                selectedStudentsByYear={selectedStudentsByYear}
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
