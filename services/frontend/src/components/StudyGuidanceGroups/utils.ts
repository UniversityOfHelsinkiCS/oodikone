import dayjs from 'dayjs'

import { isMastersProgramme } from '@/common'
import * as filters from '@/components/FilterView/filters'
import { useGetSemestersQuery } from '@/redux/semesters'
import { GetCustomPopulationResBody } from '@oodikone/shared/routes/populations'
import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'

export const createAcademicYearStartDate = (year: number) => new Date(year, 7, 1)

export const useGetFilters = (
  group: GroupsWithTags | undefined,
  population: Pick<GetCustomPopulationResBody, 'coursestatistics'> | undefined
) => {
  const { data } = useGetSemestersQuery()
  const { semesters: allSemesters } = data ?? { semesters: {} }

  const initialOptions = {}

  if (!group || population === undefined) return { viewFilters: [], initialOptions }

  const groupProgramme = group.tags?.studyProgramme
  const groupYear = group.tags?.year

  const viewFilters = [
    filters.studentNumberFilter(),
    filters.enrollmentStatusFilter({
      allSemesters: allSemesters ?? [],
      programme: groupProgramme,
    }),
    filters.ageFilter(),
    filters.genderFilter(),
    filters.startYearAtUniFilter(),
    filters.tagsFilter(),
    filters.courseFilter({
      courses: population?.coursestatistics ?? [],
    }),
    filters.creditDateFilter(),
    filters.creditsEarnedFilter(),
  ]

  if (!groupYear) {
    viewFilters.push(
      filters.programmeFilter({
        additionalModes: groupYear
          ? [
              {
                key: 'assoc-year',
                label: 'Since associated year',
                description:
                  'Student has had a study right since the start year associated with this study guidance group.',
                predicate: (_student, studyRightElement) =>
                  dayjs(createAcademicYearStartDate(Number(groupYear))).isBetween(
                    studyRightElement.startDate,
                    studyRightElement.endDate,
                    'day',
                    '[]'
                  ),
              },
            ]
          : [],
      })
    )
  }

  if (groupProgramme && isMastersProgramme(groupProgramme)) {
    viewFilters.push(
      filters.studyRightTypeFilter({
        programme: groupProgramme,
        year: groupYear,
      })
    )
  }

  if (groupProgramme && groupYear && parseInt(groupYear, 10) >= 2020) {
    viewFilters.push(
      filters.admissionTypeFilter({
        programme: groupProgramme,
      })
    )
  }

  if (groupProgramme) {
    const programmes = groupProgramme.split('+')
    viewFilters.push(
      filters.hopsFilter({
        programmeCode: programmes[0],
        combinedProgrammeCode: programmes[1] ?? '',
      })
    )
    viewFilters.push(filters.studyTrackFilter({ code: programmes[0] }))
  }

  if (groupYear) {
    initialOptions[filters.hopsFilter.key] = {
      studyStart: groupYear ? `${groupYear}-07-31` : null,
      clearCreditDate: true,
    }
  }

  return { viewFilters, initialOptions }
}
