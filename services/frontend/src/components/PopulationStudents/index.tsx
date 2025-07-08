import dayjs from 'dayjs'
import { useRef } from 'react'
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
import { GeneralTabContainer as GeneralTab } from './StudentTable/GeneralTab'
import { ModulesTabContainer as ModulesTab } from './StudentTable/ModulesTab'
import { ProgressTable as ProgressTab } from './StudentTable/ProgressTab'
import { TagsTab } from './StudentTable/TagsTab'

type PopulationDetails = {
  variant: 'population'

  programme: string
  combinedProgramme?: string

  showBachelorAndMaster: boolean

  criteria: ProgressCriteria | null
  curriculum: ExtendedCurriculumDetails | null

  filteredCourses: any[]
  filteredStudents: any[]
}

type CoursePopulation = {
  variant: 'coursePopulation'

  from: string
  to: string

  coursecodes: string[]
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

  customPopulationProgramme: string | null
  filteredStudents: any[]
  dataExport: JSX.Element
}

type MyType = (PopulationDetails | CoursePopulation | StudyGuidanceGroup | CustomPopulation) & {
  [key: string]: undefined
}

export const PopulationStudents = ({
  variant,

  programme,
  combinedProgramme,

  showBachelorAndMaster,

  criteria,
  curriculum,

  filteredStudents,
  filteredCourses,
  coursecodes,

  customPopulationProgramme,
  dataExport,
  from,
  to,
  studyGuidanceGroup,
  year,
}: MyType) => {
  const { isAdmin } = useGetAuthorizedUserQuery()
  const studentRef = useRef(null)

  if (!['population', 'customPopulation', 'coursePopulation', 'studyGuidanceGroupPopulation'].includes(variant))
    throw new Error(`${variant} is not a proper variant!`)

  const availablePanels = {
    General: () => (
      <GeneralTab
        combinedProgramme={combinedProgramme}
        coursecodes={coursecodes}
        customPopulationProgramme={customPopulationProgramme}
        filteredStudents={filteredStudents}
        from={from}
        group={studyGuidanceGroup}
        programme={programme}
        showBachelorAndMaster={showBachelorAndMaster}
        to={to}
        variant={variant}
        year={year}
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
    [K in MyType['variant']]: { panesToInclude: (keyof typeof availablePanels)[]; infotoolTipContent: string }
  } = {
    population: {
      panesToInclude:
        year === 'All' || (programme && !isBachelorOrLicentiateProgramme(programme))
          ? ['General', 'Courses', 'Modules', 'Tags']
          : ['General', 'Courses', 'Modules', 'Tags', 'Progress'],
      infotoolTipContent: populationStatisticsToolTips.studentsClass,
    },
    coursePopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: coursePopulationToolTips.students,
    },
    customPopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: populationStatisticsToolTips.studentsCustom,
    },
    studyGuidanceGroupPopulation: {
      panesToInclude: studyGuidanceGroup?.tags?.studyProgramme
        ? isBachelorOrLicentiateProgramme(studyGuidanceGroup?.tags?.studyProgramme)
          ? ['General', 'Courses', 'Modules', 'Progress']
          : ['General', 'Courses', 'Modules']
        : ['General'],
      infotoolTipContent: populationStatisticsToolTips.studentsGuidanceGroups,
    },
  }

  const contentToInclude = contentByVariant[variant]
  const panels = Object.entries(availablePanels)
    .filter(([key, _]) => contentToInclude.panesToInclude.includes(key as keyof typeof availablePanels))
    .map(([key, val]) => ({ menuItem: key, render: val }))

  if (filteredStudents.length === 0) return null
  return (
    <>
      <span ref={studentRef} style={{ marginRight: '0.5rem' }}>
        <InfoBox content={contentToInclude.infotoolTipContent} />
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
      <Tab data-cy="student-table-tabs" onTabChange={handleTabChange} panes={panels} />
    </>
  )
}
