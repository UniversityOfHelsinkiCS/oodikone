import Button from '@mui/material/Button'
import FormGroup from '@mui/material/FormGroup'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

import { CurriculumPicker } from '@/components/common/CurriculumPicker'
import { Link } from '@/components/common/Link'
import { PanelView } from '@/components/common/PanelView'
import { ToggleWithTooltip } from '@/components/common/toggle/ToggleWithTooltip'
import { creditDateFilter, hopsFilter as studyPlanFilter } from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { AgeStats } from '@/components/PopulationComponents/AgeStats'
import { CreditAccumulationGraph } from '@/components/PopulationComponents/CreditAccumulation'
import { CreditStatistics } from '@/components/PopulationComponents/CreditGainStats'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useFormat as formatGeneralTab } from '@/components/PopulationStudents/StudentTable/GeneralTab/format/index'
import { useColumns as columnsGeneralTab } from '@/components/StudyGuidanceGroups/studentColumns'
import { StudyGuidanceGroupPopulationCourses } from '@/components/StudyGuidanceGroups/StudyGuidanceGroupPopulationCourses'
import { createAcademicYearStartDate } from '@/components/StudyGuidanceGroups/utils'
import { useCurriculumState } from '@/hooks/useCurriculums'
import { KeyboardBackspaceIcon } from '@/theme'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { FormattedStudent } from '@oodikone/shared/types'
import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'

dayjsExtend(isBetween)

export const SingleStudyGuidanceGroupPanels = ({
  filteredStudents,
  filteredCourses,
  group,
}: {
  filteredStudents: FormattedStudent[]
  filteredCourses: FilteredCourse[]
  group: GroupsWithTags
}) => {
  const { useFilterSelector, useFilterDispatch: filterDispatch } = useFilters()

  const groupYear = group.tags?.year
  const groupProgramme = group.tags?.studyProgramme

  const [programme, combinedProgramme] = groupProgramme?.split('+') ?? []

  const query = {
    programme,
    combinedProgramme,
    years: groupYear ? [Number(groupYear)] : [],
  }

  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(programme, groupYear!) // TODO: fix year

  const creditDateFilterActive = useFilterSelector(creditDateFilter.selectors.isActive(undefined))
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive(undefined))

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
        <>
          {!!group.tags?.year && (
            <ToggleWithTooltip
              checked={creditDateFilterActive}
              label="Show credits starting from the associated academic year"
              onChange={toggleCreditDateFilter}
            />
          )}
          <CreditAccumulationGraph
            programmeCodes={group?.tags?.studyProgramme ? [programme, combinedProgramme] : []}
            students={filteredStudents}
            studyPlanFilter={studyPlanFilterIsActive}
          />
        </>
      ),
    },
    (programme || group?.tags?.studyProgramme) && groupYear
      ? {
          title: 'Credit statistics',
          content: <CreditStatistics filteredStudents={filteredStudents} query={query} />,
        }
      : null,
    {
      title: 'Age distribution',
      content: <AgeStats filteredStudents={filteredStudents} query={query} />,
    },
    {
      title: 'Courses of population',
      content: (
        <StudyGuidanceGroupPopulationCourses
          curriculum={curriculum}
          filteredCourses={filteredCourses}
          studyProgramme={group.tags?.studyProgramme ? programme : null}
          year={groupYear}
        />
      ),
    },
    {
      title: `Students (${filteredStudents.length})`,
      content: (
        // @ts-expect-error FIX typing
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
        />
      ),
    },
  ]

  return (
    <>
      <Paper sx={{ p: 2, my: 2 }} variant="outlined">
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <FormGroup sx={{ gap: 1 }}>
            <Link sx={{ width: 'fit-content' }} to="/studyguidancegroups">
              <Button startIcon={<KeyboardBackspaceIcon />} sx={{ mb: '10px' }} variant="contained">
                Back to groups
              </Button>
            </Link>
            <Stack flexDirection="row" gap={1} p={1} sx={{ alignItems: 'center', alignContent: 'center' }}>
              <Stack flexDirection="row" gap={1} p={1} sx={{ alignItems: 'center', alignContent: 'center' }}>
                <Typography fontWeight={800}>Choose curriculum</Typography>
                <CurriculumPicker
                  curriculum={curriculum}
                  curriculumList={curriculumList}
                  setCurriculum={setCurriculum}
                />
                <InfoBox content={'Valitsee tarkasteltavan populaation opetussuunnitelman.'} mini />
              </Stack>
            </Stack>
          </FormGroup>
        </Stack>
      </Paper>
      <PanelView panels={panels} />
    </>
  )
}
