import { useMemo } from 'react'

import { FilterView } from '@/components/FilterView'
import {
  ageFilter,
  courseFilter,
  creditDateFilter,
  creditsEarnedFilter,
  enrollmentStatusFilter,
  genderFilter,
  hopsFilter,
  programmeFilter,
  startYearAtUniFilter,
  tagsFilter,
  transferredToProgrammeFilter,
} from '@/components/FilterView/filters'
import { useGetCustomPopulationQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'

import { CustomPopulationState } from '.'
import { CustomPopulationContent } from './CustomPopulationContent'

export const CustomPopulationWrapper = ({
  customPopulationState,
  resetState,
}: {
  customPopulationState: CustomPopulationState
  resetState: () => void
}) => {
  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters } = semesters ?? { semesters: {} }

  const { data: population, isFetching } = useGetCustomPopulationQuery(
    {
      studentNumbers: customPopulationState.studentNumbers,
      tags: { studyProgramme: customPopulationState.associatedProgramme },
    },
    { skip: !customPopulationState.studentNumbers.length }
  )

  const populationStudents = population?.students ?? []
  const associatedProgramme = population?.studyProgramme
  const discardedStudentNumbers = population?.discardedStudentNumbers ?? []

  const filters = useMemo(() => {
    const filtersList = [
      genderFilter(),
      ageFilter(),
      courseFilter({ courses: population?.coursestatistics.courses ?? [] }),
      creditsEarnedFilter(),
      transferredToProgrammeFilter(),
      startYearAtUniFilter(),
      tagsFilter(),
      programmeFilter(),
      creditDateFilter(),
      enrollmentStatusFilter({
        allSemesters,
        programme: associatedProgramme,
      }),
    ]
    if (associatedProgramme) {
      filtersList.push(hopsFilter({ programmeCode: associatedProgramme, combinedProgrammeCode: '' }))
    }
    return filtersList
  }, [population, allSemesters, associatedProgramme])

  return (
    <FilterView
      coursestatistics={population?.coursestatistics}
      displayTray={populationStudents.length > 0}
      filters={filters}
      initialOptions={[]}
      name="CustomPopulation"
      students={populationStudents}
    >
      {(filteredStudents, filteredCourses) => (
        <CustomPopulationContent
          associatedProgramme={associatedProgramme}
          discardedStudentNumbers={discardedStudentNumbers}
          filteredCourses={filteredCourses}
          filteredStudents={filteredStudents}
          isFetchingPopulation={isFetching}
          populationName={customPopulationState.selectedSearch?.name}
          resetState={resetState}
          unfilteredPopulationLength={populationStudents.length}
        />
      )}
    </FilterView>
  )
}
