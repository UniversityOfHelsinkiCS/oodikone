import { useMemo } from 'react'

import { CustomPopulationState } from '@/components/CustomPopulation'
import { CustomPopulationContent } from '@/components/CustomPopulation/CustomPopulationContent'
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
import { GenericFilter } from '@/components/FilterView/filters/createFilter'
import { useSemesters } from '@/hooks/useSemesters'
import {
  useGetCustomPopulationByProgrammesQuery,
  useGetCustomPopulationByStudentNumbersQuery,
} from '@/redux/populations'
import type { FormattedStudent } from '@oodikone/shared/types/studentData'

const NO_STUDENTS: FormattedStudent[] = []
const NO_INITIAL_OPTIONS = {}

export const CustomPopulationWrapper = ({
  customPopulationState,
  resetState,
}: {
  customPopulationState: CustomPopulationState
  resetState: () => void
}) => {
  const { semesters } = useSemesters()

  const studentNumbersPopulation = useGetCustomPopulationByStudentNumbersQuery(
    {
      studentNumbers: customPopulationState.studentNumbers,
      tags: { studyProgramme: customPopulationState.associatedProgramme },
    },
    { skip: !customPopulationState.studentNumbers.length }
  )

  const programmesPopulation = useGetCustomPopulationByProgrammesQuery(
    {
      programmes: customPopulationState.programmes,
      years: customPopulationState.years,
    },
    { skip: !customPopulationState.programmes.length }
  )

  const { data: population, isFetching } = customPopulationState.studentNumbers.length
    ? studentNumbersPopulation
    : programmesPopulation

  const populationStudents = population?.students ?? NO_STUDENTS
  const associatedProgramme = studentNumbersPopulation.data?.studyProgramme
  const discardedStudentNumbers = studentNumbersPopulation.data?.discardedStudentNumbers ?? []

  const filters: GenericFilter[] = useMemo(() => {
    const filtersList = [
      genderFilter(),
      ageFilter(),
      courseFilter({
        courses: population?.coursestatistics.courses ?? [],
      }),
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
      initialOptions={NO_INITIAL_OPTIONS}
      key={JSON.stringify([
        customPopulationState.studentNumbers,
        customPopulationState.programmes,
        customPopulationState.years,
        associatedProgramme,
      ])}
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
          programmes={customPopulationState.programmes}
          resetState={resetState}
          unfilteredPopulationLength={populationStudents.length}
        />
      )}
    </FilterView>
  )
}
