import dayjs from 'dayjs'
import { Tab } from 'semantic-ui-react'

import { coursePopulationToolTips, populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { StudentNameVisibilityToggle } from '@/components/material/StudentNameVisibilityToggle'
import { useTabChangeAnalytics } from '@/hooks/tabChangeAnalytics'
import { useToggle } from '@/hooks/toggle'
import { ExtendedCurriculumDetails } from '@/hooks/useCurriculums'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { ProgressCriteria } from '@oodikone/shared/types'
import { CheckStudentList } from './CheckStudentList'
import { IncludeSubstitutionsToggle } from './IncludeSubstitutionsToggle'
import { CoursesTabContainer as CoursesTab } from './StudentTable/CoursesTab'
import type { FormattedStudentData } from './StudentTable/GeneralTab'
import { NewTable as GeneralTab } from './StudentTable/GeneralTab/NewTable'
import { ModulesTabContainer as ModulesTab } from './StudentTable/ModulesTab'
import { ProgressTable as ProgressTab } from './StudentTable/ProgressTab'
import { TagsTab } from './StudentTable/TagsTab'

type PopulationDetails = {
  variant: 'population'

  programme: string
  combinedProgramme?: string

  criteria?: ProgressCriteria
  curriculum: ExtendedCurriculumDetails | null

  filteredCourses: any[]
  filteredStudents: any[]
}

type CoursePopulation = {
  variant: 'coursePopulation'

  filteredStudents: any[]
}

type StudyGuidanceGroup = {
  variant: 'studyGuidanceGroupPopulation'

  criteria: ProgressCriteria | null
  curriculum: ExtendedCurriculumDetails | null

  studyGuidanceGroup: any
  year: string

  filteredCourses: any[]
  filteredStudents: any[]
}

type CustomPopulation = {
  variant: 'customPopulation'

  filteredStudents: any[]
  dataExport: JSX.Element
}

type PopulationStudentsProps = (PopulationDetails | CoursePopulation | StudyGuidanceGroup | CustomPopulation) & {
  [key: string]: undefined
}

export const PopulationStudents = ({
  variant,
  programme,
  combinedProgramme,
  criteria,
  curriculum,
  filteredStudents,
  filteredCourses,
  dataExport,
  studyGuidanceGroup,
  year,

  generalTabColumnFunction,
  generalTabFormattingFunction,
}: PopulationStudentsProps & {
  generalTabColumnFunction: () => [string[], string[]]
  generalTabFormattingFunction: () => Partial<FormattedStudentData>[]
}) => {
  const { isAdmin } = useGetAuthorizedUserQuery()

  if (!['population', 'customPopulation', 'coursePopulation', 'studyGuidanceGroupPopulation'].includes(variant))
    throw new Error(`${variant} is not a proper variant!`)

  const availableTabs = {
    General: () => (
      <GeneralTab
        columnFunction={generalTabColumnFunction}
        combinedProgramme={combinedProgramme}
        formattingFunction={generalTabFormattingFunction}
        includePrimaryProgramme={
          variant === 'coursePopulation' || (variant === 'studyGuidanceGroupPopulation' && !programme)
        }
        programme={programme ?? studyGuidanceGroup?.tags?.studyProgramme}
      />
    ),
    Courses: () => (
      <CoursesTab
        courses={filteredCourses}
        curriculum={curriculum}
        includeSubstitutions={includeSubstitutions}
        students={filteredStudents}
      />
    ),
    Modules: () => <ModulesTab curriculum={curriculum} students={filteredStudents} />,
    Tags: () => <TagsTab combinedProgramme={combinedProgramme} programme={programme} students={filteredStudents} />,
    Progress: () => (
      <ProgressTab
        criteria={criteria}
        curriculum={curriculum}
        months={
          studyGuidanceGroup?.tags?.year
            ? dayjs().diff(dayjs(`${studyGuidanceGroup?.tags?.year}-08-01`), 'months')
            : undefined
        }
        programme={programme}
        students={filteredStudents}
        studyGuidanceGroupProgramme={programme}
      />
    ),
  }

  const { handleTabChange, showSubstitutionToggle } = useTabChangeAnalytics()
  const [includeSubstitutions, toggleIncludeSubstitutions] = useToggle(false)

  const contentByVariant: {
    [K in PopulationStudentsProps['variant']]: {
      tabs: (keyof typeof availableTabs)[]
      tooltip: string
    }
  } = {
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
    .map(([key, val]) => ({ menuItem: key, render: val }))

  if (filteredStudents.length === 0) return null

  return (
    <>
      <span style={{ marginRight: '0.5rem' }}>
        <InfoBox content={contentToInclude.tooltip} />
      </span>
      {isAdmin ? <CheckStudentList students={filteredStudents.map(student => student.studentNumber)} /> : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', marginTop: '5px', marginBottom: '5px' }}>
          <StudentNameVisibilityToggle />
          {showSubstitutionToggle && (
            <IncludeSubstitutionsToggle
              includeSubstitutions={includeSubstitutions}
              toggleIncludeSubstitutions={toggleIncludeSubstitutions}
            />
          )}
        </div>
        {dataExport}
      </div>
      <Tab data-cy="student-table-tabs" onTabChange={handleTabChange} panes={tabs} />
    </>
  )
}
