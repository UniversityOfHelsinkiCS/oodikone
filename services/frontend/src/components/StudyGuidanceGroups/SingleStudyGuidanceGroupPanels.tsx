import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { creditDateFilter, hopsFilter as studyPlanFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox/InfoBox'
import { AgeStats } from '@/components/PopulationDetails/AgeStats'
import { CreditStatistics } from '@/components/PopulationDetails/CreditGainStats'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format/index'
import { FormattedStudent, FormattedCourse } from '@oodikone/shared/types'
import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'

import { useCurriculumState } from '../../hooks/useCurriculums'
import { useColumns as columnsGeneralTab } from './studentColumns'
import { StudyGuidanceGroupPopulationCourses } from './StudyGuidanceGroupPopulationCourses'
import { createAcademicYearStartDate } from './utils'

dayjsExtend(isBetween)

export const SingleStudyGuidanceGroupPanels = ({
  filteredStudents,
  filteredCourses,
  group,
}: {
  filteredStudents: FormattedStudent[]
  filteredCourses: FormattedCourse[]
  group: GroupsWithTags
}) => {
  const { useFilterSelector, filterDispatch } = useFilters()

  const groupYear = group.tags?.year
  const groupProgramme = group.tags?.studyProgramme

  const [programme, combinedProgramme] = groupProgramme?.split('+') ?? []

  const query = {
    programme,
    combinedProgramme,
    years: groupYear ? [Number(groupYear)] : [],
  }

  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(programme, groupYear!) // TODO: fix year

  const creditDateFilterActive = useFilterSelector(creditDateFilter.selectors.isActive())
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  const toggleCreditDateFilter = () => {
    if (creditDateFilterActive) {
      filterDispatch(creditDateFilter.actions.reset(undefined))
    } else {
      filterDispatch(
        creditDateFilter.actions.setOptions({
          startDate: dayjs(createAcademicYearStartDate(Number(groupYear))),
          endDate: null,
        })
      )
    }
  }

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <Box>
          <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
          {group.tags?.year ? (
            <Button color="primary" onClick={() => toggleCreditDateFilter()} variant="outlined">
              {creditDateFilterActive ? 'Show all credits' : 'Show starting from associated year'}
            </Button>
          ) : null}
          <CreditAccumulationGraphHighCharts
            absences={null}
            endDate={null}
            programmeCodes={group?.tags?.studyProgramme ? [programme, combinedProgramme] : []}
            selectedStudyPlan={null}
            showBachelorAndMaster={null}
            singleStudent={false}
            startDate={null}
            students={filteredStudents}
            studyPlanFilterIsActive={studyPlanFilterIsActive}
            studyRightId={null}
          />
        </Box>
      ),
    },
    (programme || group?.tags?.studyProgramme) && groupYear
      ? {
          title: 'Credit statistics',
          content: (
            <div>
              <CreditStatistics filteredStudents={filteredStudents} query={query} />
            </div>
          ),
        }
      : null,
    {
      title: 'Age distribution',
      content: <AgeStats filteredStudents={filteredStudents} query={query} />,
    },
    {
      title: 'Courses of population',
      content: (
        <div>
          <StudyGuidanceGroupPopulationCourses
            curriculum={curriculum}
            curriculumList={curriculumList}
            filteredCourses={filteredCourses}
            filteredStudents={filteredStudents}
            setCurriculum={setCurriculum}
            studyProgramme={group.tags?.studyProgramme ? programme : null}
            year={groupYear}
          />
        </div>
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        <div>
          {/* @ts-expect-error FIX typing */}
          <PopulationStudents
            curriculum={curriculum}
            filteredCourses={filteredCourses}
            filteredStudents={filteredStudents}
            generalTabColumnFunction={() => columnsGeneralTab({ group })}
            generalTabFormattingFunction={() =>
              formatGeneralTab({
                variant: 'studyGuidanceGroupPopulation',
                filteredStudents,

                years: groupYear ? [Number(groupYear)] : [],

                programme: group.tags?.studyProgramme?.split('+')[0],
                combinedProgramme: group.tags?.studyProgramme?.split('+')[1],

                showBachelorAndMaster: false,
                includePrimaryProgramme: true,

                coursecodes: [],
                from: undefined,
                to: undefined,
              })
            }
            programme={group.tags?.studyProgramme?.split('+').at(0)}
            studyGuidanceGroup={group}
            variant="studyGuidanceGroupPopulation"
            year={groupYear ?? undefined}
          />
        </div>
      ),
    },
  ]

  return <PanelView panels={panels} />
}
