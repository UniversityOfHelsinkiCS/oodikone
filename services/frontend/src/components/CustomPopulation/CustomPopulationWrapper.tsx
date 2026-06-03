import { useMemo } from 'react'

import { FilterView } from '@/components/FilterView'
import {
  ageFilter,
  courseFilter,
  creditDateFilter,
  creditsEarnedFilter,
  hetuFilter,
  enrollmentStatusFilter,
  genderFilter,
  hopsFilter,
  programmeFilter,
  startYearAtUniFilter,
  tagsFilter,
  transferredToProgrammeFilter,
} from '@/components/FilterView/filters'
import { useSemesters } from '@/hooks/useSemesters'
import { useGetCustomPopulationQuery } from '@/redux/populations'
import { GenericFilter } from '../FilterView/filters/createFilter'
import { CustomPopulationState } from '.'
import { CustomPopulationContent } from './CustomPopulationContent'

export const CustomPopulationWrapper = ({
  customPopulationState,
  resetState,
}: {
  customPopulationState: CustomPopulationState
  resetState: () => void
}) => {
  const { semesters } = useSemesters()

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

  const filters: GenericFilter[] = useMemo(() => {
    const filtersList = [
      genderFilter(),
      ageFilter(),
      courseFilter({ courses: population?.coursestatistics.courses ?? [] }),
      creditsEarnedFilter(),
      transferredToProgrammeFilter(),
      startYearAtUniFilter(),
      tagsFilter(),
      hetuFilter(),
      programmeFilter(),
      creditDateFilter(),
      enrollmentStatusFilter({
        allSemesters: semesters,
        programme: associatedProgramme,
      }),
    ]
    if (associatedProgramme) {
      filtersList.push(hopsFilter({ programmeCode: associatedProgramme, combinedProgrammeCode: '' }))
    }
    return filtersList
  }, [population, semesters, associatedProgramme])

  return (
    <FilterView
      coursestatistics={population?.coursestatistics}
      filters={filters}
      initialOptions={{}}
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
