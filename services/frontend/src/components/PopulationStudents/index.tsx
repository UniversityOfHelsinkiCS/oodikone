import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import dayjs from 'dayjs'
import { useState } from 'react'

import { coursePopulationToolTips, populationStatisticsToolTips } from '@/common/InfoToolTips'

import { InfoBox as NewInfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { FilteredCourse } from '@/util/coursesOfPopulation'
import { parseQueryParams } from '@/util/queryparams'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { FormattedStudent } from '@oodikone/shared/types'
import { CoursesTabContainer as CoursesTab } from './StudentTable/CoursesTab'
import { type FormattedStudentData, GeneralTab } from './StudentTable/GeneralTab'
import { ModulesTabContainer as ModulesTab } from './StudentTable/ModulesTab'
import { ProgressTable as ProgressTab } from './StudentTable/ProgressTab'
import { TagsTab } from './StudentTable/TagsTab'

type CommonProps = {
  filteredStudents: FormattedStudent[]
  generalTabColumnFunction: () => [string[], string[]]
  generalTabFormattingFunction: () => Partial<FormattedStudentData>[]
}

type PopulationDetails = CommonProps & {
  variant: 'population'
  programme: string
  combinedProgramme?: string
  curriculum: ExtendedCurriculumDetails | null
  filteredCourses: FilteredCourse[]
}

type CoursePopulation = CommonProps & {
  variant: 'coursePopulation'
}

type StudyGuidanceGroup = CommonProps & {
  variant: 'studyGuidanceGroupPopulation'
  curriculum: ExtendedCurriculumDetails | null
  studyGuidanceGroup: any
  year: string
  filteredCourses: FilteredCourse[]
}

type CustomPopulation = CommonProps & {
  variant: 'customPopulation'
  dataExport: JSX.Element
}

type PopulationStudentsProps = (PopulationDetails | CoursePopulation | StudyGuidanceGroup | CustomPopulation) &
  Record<string, any>

/**
 * TODO: FIXME: do not lose typing
 * Ensure the props at call site are what expected, as the types are lost here and need to be asserted
 */
export const PopulationStudents = ({
  variant,
  programme,
  combinedProgramme,
  curriculum,
  filteredStudents,
  filteredCourses,
  dataExport,
  studyGuidanceGroup,
  year,
  generalTabColumnFunction,
  generalTabFormattingFunction,
}: PopulationStudentsProps) => {
  const [tab, setTab] = useState(0)

  if (!['population', 'customPopulation', 'coursePopulation', 'studyGuidanceGroupPopulation'].includes(variant))
    throw new Error(`${variant} is not a proper variant!`)

  const { years } = parseQueryParams(location.search)
  const months = years
    ? dayjs().diff(dayjs(`${Math.min(years)}-08-01`), 'months')
    : studyGuidanceGroup?.tags?.year
      ? dayjs().diff(dayjs(`${studyGuidanceGroup?.tags?.year}-08-01`), 'months')
      : undefined

  const availableTabs = {
    General: (
      <GeneralTab
        columnFunction={generalTabColumnFunction}
        combinedProgramme={combinedProgramme}
        formattingFunction={generalTabFormattingFunction}
        includePrimaryProgramme={
          variant === 'coursePopulation' || (variant === 'studyGuidanceGroupPopulation' && !programme)
        }
        programme={programme ?? studyGuidanceGroup?.tags?.studyProgramme}
        unihowExport={dataExport}
      />
    ),
    Courses: (
      <CoursesTab
        courses={filteredCourses ?? []}
        curriculum={curriculum} // TODO: add guard for missing curriculum (it should never be missing)
        students={filteredStudents}
      />
    ),
    Modules: <ModulesTab curriculum={curriculum} students={filteredStudents} />,
    Tags: <TagsTab combinedProgramme={combinedProgramme} programme={programme} students={filteredStudents} />,
    Progress: (
      <ProgressTab
        curriculum={curriculum}
        months={months}
        programme={programme}
        students={filteredStudents}
        studyGuidanceGroupProgramme={programme}
      />
    ),
  }

  const contentByVariant: Record<
    PopulationStudentsProps['variant'],
    {
      tabs: (keyof typeof availableTabs)[]
      tooltip: string
    }
  > = {
    population: {
      tabs:
        year === 'All' || (programme && !isBachelorOrLicentiateProgramme(programme))
          ? ['General', 'Courses', 'Modules', 'Tags']
          : ['General', 'Courses', 'Modules', 'Tags', 'Progress'],
      tooltip: populationStatisticsToolTips.studentsClass,
    },
    coursePopulation: {
      tabs: ['General'],
      tooltip: coursePopulationToolTips.students,
    },
    customPopulation: {
      tabs: ['General'],
      tooltip: populationStatisticsToolTips.studentsCustom,
    },
    studyGuidanceGroupPopulation: {
      tabs: studyGuidanceGroup?.tags?.studyProgramme
        ? isBachelorOrLicentiateProgramme(studyGuidanceGroup?.tags?.studyProgramme)
          ? ['General', 'Courses', 'Modules', 'Progress']
          : ['General', 'Courses', 'Modules']
        : ['General'],
      tooltip: populationStatisticsToolTips.studentsGuidanceGroups,
    },
  }

  const contentToInclude = contentByVariant[variant]
  const tabs = Object.entries(availableTabs)
    .filter(([key, _]) => contentToInclude.tabs.includes(key as keyof typeof availableTabs))
    .map(([key, val]) => ({ label: key, render: val }))

  if (filteredStudents.length === 0) return null

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tabs data-cy="student-table-tabs" onChange={(_, newTab) => setTab(newTab)} value={tab}>
          {tabs.map(({ label }) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
        <NewInfoBox content={contentToInclude.tooltip} sx={{ mb: 1, mr: 1 }} />
      </Box>
      {tabs[tab].render}
    </>
  )
}
