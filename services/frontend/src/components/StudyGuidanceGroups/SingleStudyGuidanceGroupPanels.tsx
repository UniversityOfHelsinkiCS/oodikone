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
import { PopulationStudents } from '@/components/PopulationComponents/Students'
import { useFormat as formatGeneralTab } from '@/components/PopulationComponents/Students/Table/GeneralTab/format'
import { useColumns as columnsGeneralTab } from '@/components/StudyGuidanceGroups/studentColumns'
import { StudyGuidanceGroupPopulationCourses } from '@/components/StudyGuidanceGroups/StudyGuidanceGroupPopulationCourses'
import { createAcademicYearStartDate } from '@/components/StudyGuidanceGroups/utils'
import { CurriculumProvider, useCurriculum } from '@/hooks/useCurriculum'
import { KeyboardBackspaceIcon } from '@/theme'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { FormattedStudent } from '@oodikone/shared/types'
import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'
import { useLanguage } from '../LanguagePicker/useLanguage'

dayjsExtend(isBetween)

type SingleStudyGuidanceGroupPanelsProps = {
  filteredStudents: FormattedStudent[]
  filteredCourses: FilteredCourse[]
  group: GroupsWithTags
  idToGroupIdMap: Record<string, string>
}

const curriculumInfoBoxContent = {
  fi: 'Valitsee tarkasteltavan populaation opetussuunnitelman. Opetussuunnitelman valitseminen edellyttää koulutusohjelman asettamista populaatiolle.',
  en: 'Selects the curriculum to be used for the population. Setting a curriculum requires a degree programme to be set for the population.',
}

export const SingleStudyGuidanceGroupPanels = (props: SingleStudyGuidanceGroupPanelsProps) => {
  const [programme] = props.group.tags?.studyProgramme?.split('+') ?? []
  const year = props.group.tags?.year ?? undefined

  return (
    <CurriculumProvider programmeCode={programme} year={year}>
      <SingleStudyGuidanceGroupPanelsContent {...props} />
    </CurriculumProvider>
  )
}

const SingleStudyGuidanceGroupPanelsContent = ({
  filteredStudents,
  filteredCourses,
  group,
  idToGroupIdMap,
}: SingleStudyGuidanceGroupPanelsProps) => {
  const { useFilterSelector, useFilterDispatch: filterDispatch } = useFilters()
  const { getTextIn } = useLanguage()

  const groupYear = group.tags?.year
  const groupProgramme = group.tags?.studyProgramme

  const [programme, combinedProgramme] = groupProgramme?.split('+') ?? []

  const query = {
    programme,
    combinedProgramme,
    years: groupYear ? [Number(groupYear)] : [],
  }

  const { curriculum, curriculumList, setSelectedCurriculum: setCurriculum } = useCurriculum()

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
          filteredCourses={filteredCourses}
          filteredStudents={filteredStudents}
          generalTabColumnFunction={() => columnsGeneralTab({ group })}
          idToGroupIdMap={idToGroupIdMap}
          generalTabFormattingFunction={() =>
            formatGeneralTab({
              variant: 'studyGuidanceGroupPopulation',
              filteredStudents,

              years: groupYear ? [Number(groupYear)] : [],

              programme: group.tags?.studyProgramme?.split('+')[0],
              combinedProgramme: group.tags?.studyProgramme?.split('+')[1],

              showBachelorAndMaster: false,
              includePrimaryProgramme: true,

              courseIds: [],
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
                <InfoBox content={getTextIn(curriculumInfoBoxContent) ?? ''} mini />
              </Stack>
            </Stack>
          </FormGroup>
        </Stack>
      </Paper>
      <PanelView panels={panels} />
    </>
  )
}
