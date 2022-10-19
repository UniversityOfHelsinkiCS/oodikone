import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useHistory } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import { useGetSemestersQuery } from 'redux/semesters'
import populationToData from 'selectors/populationDetails'
import { getStudentTotalCredits } from 'common'
import PopulationDetails from '../PopulationDetails'
import { useTitle } from '../../common/hooks'
import useLanguage from '../LanguagePicker/useLanguage'
import { getTextIn } from '../../common'
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
  studyrightStatusFilter,
  studentNumberFilter,
  hopsFilter,
} from '../FilterView/filters'

const PopulationStatistics = () => {
  const location = useLocation()
  const { language } = useLanguage()
  const history = useHistory()
  // const { query, queryIsSet, isLoading, students } = useSelector(selectPopulations)
  const courses = useSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  const { query, queryIsSet, isLoading, selectedStudentsByYear, samples } = useSelector(
    populationToData.makePopulationsToData
  )

  useTitle('Class statistics')

  const { data: allSemesters } = useGetSemestersQuery()

  const programmeCode = query?.studyRights?.programme
  const programmes = useSelector(store => store.populationProgrammes?.data?.programmes)
  const programmeName = programmes && programmeCode ? programmes[programmeCode]?.name : ''

  const filters = [
    studentNumberFilter,
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
      const studyrightStartDate = new Date(student.studyrightStart)
      const courses = student.courses.filter(({ date }) => new Date(date) >= studyrightStartDate)
      const credits = getStudentTotalCredits({ courses })
      return {
        ...student,
        allCredits: student.credits,
        hopsCredits,
        credits,
      }
    })
  }, [samples, programmeCode])

  const title =
    location.search === ''
      ? 'Class statistics'
      : `${getTextIn(programmeName, language)} ${query?.year} - ${Number(query?.year) + 1}`

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
        [hopsFilter.key]: {
          studyStart: (students[0] || {}).studyrightStart,
        },
      }}
    >
      {filteredStudents => (
        <div className="segmentContainer" style={{ flexGrow: 1 }}>
          <Header className="segmentTitle" size="large" align="center">
            {title}
            {location.search !== '' && (
              <Header.Subheader>
                studytime {query?.months} months, class size {students.length} students
              </Header.Subheader>
            )}
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
