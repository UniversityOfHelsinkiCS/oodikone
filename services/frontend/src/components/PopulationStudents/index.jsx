import moment from 'moment'
import { useRef } from 'react'
import { useSelector } from 'react-redux'
import { Tab } from 'semantic-ui-react'

import { coursePopulationToolTips, populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { StudentNameVisibilityToggle } from '@/components/material/StudentNameVisibilityToggle'
import { useTabChangeAnalytics } from '@/hooks/tabChangeAnalytics'
import { useToggle } from '@/hooks/toggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetTagsByStudyTrackQuery } from '@/redux/tags'
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
  studentToTargetCourseDateMap,
  studyGuidanceGroup,
  to,
  variant,
  visiblePanes,
  year,
}) => {
  const { handleTabChange } = useTabChangeAnalytics()
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
          coursecode={coursecode}
          customPopulationProgramme={customPopulationProgramme}
          filteredStudents={filteredStudents}
          from={from}
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          studyGuidanceGroup={studyGuidanceGroup}
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
          curriculum={curriculum}
          includeSubstitutions={includeSubstitutions}
          students={filteredStudents}
          studyGuidanceGroup={studyGuidanceGroup}
          variant={variant}
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
        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
          <StudentNameVisibilityToggle />
          <IncludeSubstitutionsToggle
            includeSubstitutions={includeSubstitutions}
            toggleIncludeSubstitutions={toggleIncludeSubstitutions}
          />
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
  studentToTargetCourseDateMap,
  studyGuidanceGroup,
  variant,
  year,
}) => {
  const studentRef = useRef()
  const { query } = useSelector(({ populations }) => populations)
  let mainProgramme = query?.studyRights?.programme || ''
  let combinedProgramme = query?.studyRights?.combinedProgramme || ''
  let months = query ? query.months : 0
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
        studentToTargetCourseDateMap={studentToTargetCourseDateMap}
        studyGuidanceGroup={studyGuidanceGroup}
        to={to}
        variant={variant}
        visiblePanes={contentToInclude.panesToInclude}
        year={year}
      />
    </>
  )
}

const getTabs = programmeCode => {
  if (programmeCode && (programmeCode.includes('KH') || ['MH30_001', 'MH30_003'].includes(programmeCode))) {
    return ['General', 'Courses', 'Progress']
  }
  if (programmeCode) {
    return ['General', 'Courses']
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
        props.year === 'All' ||
        (props.programmeCode &&
          !props.programmeCode.includes('KH') &&
          !['MH30_001', 'MH30_003'].includes(props.programmeCode))
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
