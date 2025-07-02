import dayjs from 'dayjs'
import { useRef } from 'react'
import { Tab } from 'semantic-ui-react'

import { coursePopulationToolTips, populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { StudentNameVisibilityToggle } from '@/components/material/StudentNameVisibilityToggle'
import { useTabChangeAnalytics } from '@/hooks/tabChangeAnalytics'
import { useToggle } from '@/hooks/toggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { CheckStudentList } from './CheckStudentList'
import { IncludeSubstitutionsToggle } from './IncludeSubstitutionsToggle'
import { CoursesTabContainer as CoursesTab } from './StudentTable/CoursesTab'
import { GeneralTabContainer as GeneralTab } from './StudentTable/GeneralTab'
import { ModulesTabContainer as ModulesTab } from './StudentTable/ModulesTab'
import { ProgressTable as ProgressTab } from './StudentTable/ProgressTab'
import { TagsTab } from './StudentTable/TagsTab'

const Panels = ({
  combinedProgramme,
  coursecodes,
  curriculum,
  customPopulationProgramme,
  criteria,
  dataExport,
  filteredStudents,
  courses,
  from,
  mainProgramme,
  months,
  studyGuidanceGroup,
  to,
  variant,
  selectedPanels,
  year,
  studyRights,
  showBachelorAndMaster,
}) => {
  const { handleTabChange, showSubstitutionToggle } = useTabChangeAnalytics()
  const [includeSubstitutions, toggleIncludeSubstitutions] = useToggle(false)
  const programmeForTagsLink = combinedProgramme ? `${mainProgramme}+${combinedProgramme}` : mainProgramme
  const programme = studyGuidanceGroup?.tags?.studyProgramme ?? ''

  const availablePanels = [
    {
      menuItem: 'General',
      render: () => (
        <GeneralTab
          coursecodes={coursecodes}
          customPopulationProgramme={customPopulationProgramme}
          filteredStudents={filteredStudents}
          from={from}
          group={studyGuidanceGroup}
          showBachelorAndMaster={showBachelorAndMaster}
          studyRights={studyRights}
          to={to}
          variant={variant}
          year={year}
        />
      ),
    },
    {
      menuItem: 'Courses',
      render: () => (
        <CoursesTab
          courses={courses}
          curriculum={curriculum}
          includeSubstitutions={includeSubstitutions}
          students={filteredStudents}
        />
      ),
    },
    {
      menuItem: 'Modules',
      render: () => <ModulesTab curriculum={curriculum} students={filteredStudents} />,
    },
    {
      menuItem: 'Tags',
      render: () => (
        <TagsTab
          combinedProgramme={combinedProgramme}
          mainProgramme={mainProgramme}
          programmeForTagsLink={programmeForTagsLink}
          students={filteredStudents}
        />
      ),
    },
    {
      menuItem: 'Progress',
      render: () => (
        <ProgressTab
          criteria={criteria}
          curriculum={curriculum}
          months={months}
          programme={mainProgramme ?? programme}
          students={filteredStudents}
          studyGuidanceGroupProgramme={programme}
        />
      ),
    },
  ]

  const panels = availablePanels.filter(pane => selectedPanels.includes(pane.menuItem))

  return (
    <>
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

const getTabs = programmeCode => {
  if (programmeCode && isBachelorOrLicentiateProgramme(programmeCode)) {
    return ['General', 'Courses', 'Modules', 'Progress']
  } else if (programmeCode) {
    return ['General', 'Courses', 'Modules']
  }

  return ['General']
}

export const PopulationStudents = ({
  coursecodes = [],
  curriculum,
  customPopulationProgramme,
  criteria,
  dataExport,
  filteredStudents,
  filteredCourses,
  from,
  to,
  months: initMonths,
  studyRights,
  studyGuidanceGroup,
  variant,
  year,
  showBachelorAndMaster,
  programmeCode,
}) => {
  if (!['population', 'customPopulation', 'coursePopulation', 'studyGuidanceGroupPopulation'].includes(variant)) {
    throw new Error(`${variant} is not a proper variant!`)
  }
  const contentByVariant = {
    population: {
      panesToInclude:
        year === 'All' || (programmeCode && !isBachelorOrLicentiateProgramme(programmeCode))
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
      panesToInclude: getTabs(studyGuidanceGroup?.tags?.studyProgramme),
      infotoolTipContent: populationStatisticsToolTips.studentsGuidanceGroups,
    },
  }

  const contentToInclude = contentByVariant[variant as keyof typeof contentByVariant]

  const studentRef = useRef(null)
  let mainProgramme = studyRights?.programme ?? ''
  let combinedProgramme = studyRights?.combinedProgramme ?? ''

  let months = initMonths
  if (studyGuidanceGroup?.tags?.year) {
    months = dayjs().diff(dayjs(`${studyGuidanceGroup?.tags?.year}-08-01`), 'months')
  }

  if (studyGuidanceGroup?.tags?.studyProgramme) {
    const programmes = studyGuidanceGroup.tags.studyProgramme.split('+')

    mainProgramme = programmes[0]
    combinedProgramme = programmes[1] ?? ''
  }

  const { isAdmin } = useGetAuthorizedUserQuery()

  if (filteredStudents.length === 0) {
    return null
  }

  return (
    <>
      <span ref={studentRef} style={{ marginRight: '0.5rem' }}>
        <InfoBox content={contentToInclude.infotoolTipContent} />
      </span>
      {isAdmin ? <CheckStudentList students={filteredStudents.map(student => student.studentNumber)} /> : null}
      <Panels
        combinedProgramme={combinedProgramme}
        coursecodes={coursecodes}
        courses={filteredCourses}
        criteria={criteria}
        curriculum={curriculum}
        customPopulationProgramme={customPopulationProgramme}
        dataExport={dataExport}
        filteredStudents={filteredStudents}
        from={from}
        mainProgramme={mainProgramme}
        months={months}
        selectedPanels={contentToInclude.panesToInclude}
        showBachelorAndMaster={showBachelorAndMaster}
        studyGuidanceGroup={studyGuidanceGroup}
        studyRights={studyRights}
        to={to}
        variant={variant}
        year={year}
      />
    </>
  )
}
