import { isEqual } from 'lodash'
import { useCallback, useEffect } from 'react'
import { Segment } from 'semantic-ui-react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { useDeepMemo } from '@/hooks/deepMemo'
import { useAppSelector, useAppDispatch } from '@/redux/hooks'
import { getPopulationSelectedStudentCourses } from '@/redux/populationSelectedStudentCourses'
import { FilterDegreeCoursesModal } from './FilterDegreeCoursesModal'

const mapStudentNumbersToStartingYears = samples => {
  const years = [...new Set(samples.map(student => new Date(student.studyrightStart).getFullYear()))]
  const studentsToYears = Object.fromEntries(years.map(y => [y, []]))

  samples.forEach(student => {
    studentsToYears[new Date(student.studyrightStart).getFullYear()].push(student.studentNumber)
  })

  return studentsToYears
}

export const PopulationCourses = ({
  query,
  filteredStudents,
  onlyIamRights,
  curriculum: mandatoryCourses,
  courseTableMode,
  studentAmountLimit,
}) => {
  const dispatch = useAppDispatch()
  const selectedStudentsByYear = mapStudentNumbersToStartingYears(filteredStudents ?? [])

  const {
    query: courseQuery,
    data,
    pending,
  } = useAppSelector(({ populationSelectedStudentCourses }) => populationSelectedStudentCourses)

  const fetch = useCallback(
    courses => {
      dispatch(
        getPopulationSelectedStudentCourses({
          ...query,
          studyRights: [query.studyRights.programme],
          selectedStudents: onlyIamRights
            ? filteredStudents.map(({ studentNumber, iv }) => ({ encryptedData: studentNumber, iv }))
            : filteredStudents.map(student => student.studentNumber),
          selectedStudentsByYear,
          courses,
        })
      )
    },
    [dispatch, filteredStudents, onlyIamRights, query, selectedStudentsByYear]
  )

  const programmeCourses = useDeepMemo(() => {
    if (!mandatoryCourses) {
      return null
    }
    const mandatoryCourseCodes = mandatoryCourses.defaultProgrammeCourses.map(({ code }) => code)
    const mandatoryCourseCodesSecondProg = mandatoryCourses.secondProgrammeCourses.map(({ code }) => code)
    return [...mandatoryCourseCodes, ...mandatoryCourseCodesSecondProg]
  }, [mandatoryCourses])

  useEffect(() => {
    if (programmeCourses == null || courseQuery == null) {
      return
    }
    const { courses, selectedStudents } = courseQuery
    if (
      !isEqual(programmeCourses, courses) ||
      selectedStudents.length !== filteredStudents.length ||
      !isEqual(
        onlyIamRights ? selectedStudents.map(student => student.encryptedData) : selectedStudents,
        filteredStudents.map(({ studentNumber }) => studentNumber)
      )
    ) {
      fetch(programmeCourses)
    }
  }, [programmeCourses, filteredStudents, courseQuery, onlyIamRights, fetch])

  const isPending = pending || !mandatoryCourses

  return (
    <Segment basic>
      <div style={{ display: 'flex' }}>
        {courseTableMode === 'curriculum' ? (
          <div style={{ marginBottom: '20px', marginRight: '10px' }}>
            <InfoBox content={populationStatisticsToolTips.coursesOfClass} />
          </div>
        ) : (
          <div style={{ marginBottom: '20px', marginRight: '10px' }}>
            <InfoBox content={populationStatisticsToolTips.coursesOfPopulation} />
          </div>
        )}
        {query.studyRights.programme && !onlyIamRights && (
          <div style={{ marginBottom: '20px' }}>
            <FilterDegreeCoursesModal studyProgramme={query.studyRights.programme} year={query.year} />
          </div>
        )}
      </div>
      <SegmentDimmer isLoading={isPending} />
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats
          courses={data ?? []}
          key={courseQuery?.uuid}
          mandatoryCourses={mandatoryCourses}
          onlyIamRights={onlyIamRights}
          pending={isPending}
        />
      ) : (
        <PopulationCourseStatsFlat
          courses={isPending ? null : (data ?? [])}
          filteredStudents={filteredStudents}
          studentAmountLimit={studentAmountLimit}
        />
      )}
    </Segment>
  )
}
