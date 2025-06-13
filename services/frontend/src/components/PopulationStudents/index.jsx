import moment from 'moment'
import { useRef } from 'react'
import { Tab } from 'semantic-ui-react'

import { coursePopulationToolTips, populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { StudentNameVisibilityToggle } from '@/components/material/StudentNameVisibilityToggle'
import { useTabChangeAnalytics } from '@/hooks/tabChangeAnalytics'
import { useToggle } from '@/hooks/toggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetTagsByStudyTrackQuery } from '@/redux/tags'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { CheckStudentList } from './CheckStudentList'
import { IncludeSubstitutionsToggle } from './IncludeSubstitutionsToggle'
import { CoursesTabContainer as CoursesTab } from './StudentTable/CoursesTab'
import { GeneralTabContainer as GeneralTab } from './StudentTable/GeneralTab'
import { ModulesTabContainer as ModulesTab } from './StudentTable/ModulesTab'
import { ProgressTable as ProgressTab } from './StudentTable/ProgressTab'
import { TagsTab } from './StudentTable/TagsTab'

const Panes = ({
  combinedProgramme,
  coursecode,
  curriculum,
  customPopulationProgramme,
  criteria,
  dataExport,
  filteredStudents,
  from,
  mainProgramme,
  months,
  studyGuidanceGroup,
  to,
  variant,
  visiblePanes,
  year,
  studyRights,
  showBachelorAndMaster,
}) => {
  const { handleTabChange, showSubstitutionToggle } = useTabChangeAnalytics()
  const [includeSubstitutions, toggleIncludeSubstitutions] = useToggle(false)
  const programmeForTagsLink = combinedProgramme ? `${mainProgramme}+${combinedProgramme}` : mainProgramme
  const programme = studyGuidanceGroup?.tags?.studyProgramme || ''
  const correctCode = combinedProgramme ? `${mainProgramme}+${combinedProgramme}` : mainProgramme
  const { data: tags } = useGetTagsByStudyTrackQuery(correctCode, { skip: !correctCode })

  const panesAvailable = [
    {
      menuItem: 'General',
      render: () => (
        <GeneralTab
          courseCode={coursecode}
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
        <CoursesTab curriculum={curriculum} includeSubstitutions={includeSubstitutions} students={filteredStudents} />
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
          tags={tags}
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
          programme={mainProgramme || programme}
          students={filteredStudents}
          studyGuidanceGroupProgramme={programme}
        />
      ),
    },
  ]

  const panes = panesAvailable.filter(pane => visiblePanes.includes(pane.menuItem))

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
      <Tab data-cy="student-table-tabs" onTabChange={handleTabChange} panes={panes} />
    </>
  )
}

const PopulationStudents = ({
  contentToInclude,
  coursecode = [],
  curriculum,
  customPopulationProgramme,
  criteria,
  dataExport,
  filteredStudents,
  from,
  to,
  months: initMonths,
  studyRights,
  studyGuidanceGroup,
  variant,
  year,
  showBachelorAndMaster,
}) => {
  const studentRef = useRef()
  let mainProgramme = studyRights?.programme || ''
  let combinedProgramme = studyRights?.combinedProgramme || ''

  let months = initMonths
  if (studyGuidanceGroup && studyGuidanceGroup?.tags?.year) {
    months = moment().diff(moment(`${studyGuidanceGroup?.tags?.year}-08-01`), 'months')
  }

  if (studyGuidanceGroup && studyGuidanceGroup?.tags?.studyProgramme) {
    const programmes = studyGuidanceGroup.tags.studyProgramme.includes('+')
      ? studyGuidanceGroup.tags.studyProgramme.split('+')
      : [studyGuidanceGroup.tags.studyProgramme]

    mainProgramme = programmes[0]
    combinedProgramme = programmes.length > 1 ? programmes[1] : ''
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
      <Panes
        combinedProgramme={combinedProgramme}
        coursecode={coursecode}
        criteria={criteria}
        curriculum={curriculum}
        customPopulationProgramme={customPopulationProgramme}
        dataExport={dataExport}
        filteredStudents={filteredStudents}
        from={from}
        mainProgramme={mainProgramme}
        months={months}
        showBachelorAndMaster={showBachelorAndMaster}
        studyGuidanceGroup={studyGuidanceGroup}
        studyRights={studyRights}
        to={to}
        variant={variant}
        visiblePanes={contentToInclude.panesToInclude}
        year={year}
      />
    </>
  )
}

const getTabs = programmeCode => {
  if (programmeCode && isBachelorOrLicentiateProgramme(programmeCode)) {
    return ['General', 'Courses', 'Modules', 'Progress']
  }
  if (programmeCode) {
    return ['General', 'Courses', 'Modules']
  }
  return ['General']
}

export const PopulationStudentsContainer = ({ ...props }) => {
  const { variant } = props
  if (!['population', 'customPopulation', 'coursePopulation', 'studyGuidanceGroupPopulation'].includes(variant)) {
    throw new Error(`${variant} is not a proper variant!`)
  }
  const contentByVariant = {
    population: {
      panesToInclude:
        props.year === 'All' || (props.programmeCode && !isBachelorOrLicentiateProgramme(props.programmeCode))
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
      panesToInclude: getTabs(props.studyGuidanceGroup?.tags?.studyProgramme),
      infotoolTipContent: populationStatisticsToolTips.studentsGuidanceGroups,
    },
  }

  return <PopulationStudents contentToInclude={contentByVariant[variant]} {...props} />
}
