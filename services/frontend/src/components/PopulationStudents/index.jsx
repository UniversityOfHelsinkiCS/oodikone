import moment from 'moment'
import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Tab } from 'semantic-ui-react'

import { useTabChangeAnalytics } from '@/common/hooks'
import { coursePopulationToolTips, populationStatisticsToolTips } from '@/common/InfoToolTips'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { getTagsByStudytrackAction } from '@/redux/tags'
import { getStudentTagsByStudytrackAction } from '@/redux/tagstudent'
import { InfoBox } from '../Info/InfoBox'
import { StudentNameVisibilityToggle } from '../StudentNameVisibilityToggle'
import { ConnectedTagList as TagList } from '../TagList'
import { ConnectedTagPopulation as TagPopulation } from '../TagPopulation'
import { CheckStudentList } from './CheckStudentList'
import { CoursesTabContainer as CoursesTab } from './StudentTable/CourseTab'
import { GeneralTabContainer as GeneralTab } from './StudentTable/GeneralTab'
import { ProgressTable } from './StudentTable/ProgressTab'
import './populationStudents.css'
import '../PopulationCourseStats/populationCourseStats.css'

const Panes = ({
  filteredStudents,
  tags,
  visiblePanes,
  dataExport,
  variant,
  studentToTargetCourseDateMap,
  coursecode,
  studyGuidanceGroup,
  customPopulationProgramme,
  mainProgramme,
  combinedProgramme,
  from,
  to,
  criteria,
  months,
  year,
  curriculum,
}) => {
  const { handleTabChange } = useTabChangeAnalytics()
  const programmeForTagsLink = combinedProgramme ? `${mainProgramme}+${combinedProgramme}` : mainProgramme
  const programme = studyGuidanceGroup?.tags?.studyProgramme || ''
  const panesAvailable = [
    {
      menuItem: 'General',
      render: () => (
        <Tab.Pane>
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
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Courses',
      render: () => (
        <CoursesTab
          curriculum={curriculum}
          students={filteredStudents}
          studyGuidanceGroup={studyGuidanceGroup}
          variant={variant}
        />
      ),
    },
    {
      menuItem: 'Tags',
      render: () => (
        <Tab.Pane>
          <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
            {tags.length === 0 && (
              <div
                style={{
                  paddingLeft: '10px',
                  minHeight: '300px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <h3>
                  No tags defined. You can define them{' '}
                  <Link onClick={() => {}} to={`/study-programme/${programmeForTagsLink}?p_m_tab=0&p_tab=4`}>
                    here
                  </Link>
                  .
                </h3>
              </div>
            )}
            {tags.length > 0 && (
              <>
                <TagPopulation
                  combinedProgramme={combinedProgramme}
                  mainProgramme={mainProgramme}
                  selectedStudents={filteredStudents.map(stu => stu.studentNumber)}
                  tags={tags}
                />
                <TagList
                  combinedProgramme={combinedProgramme}
                  mainProgramme={mainProgramme}
                  selectedStudents={filteredStudents}
                />
              </>
            )}
          </div>
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Progress',
      render: () => (
        <ProgressTable
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
        <StudentNameVisibilityToggle />
        {dataExport}
      </div>
      <Tab data-cy="student-table-tabs" onTabChange={handleTabChange} panes={panes} />
    </>
  )
}

const PopulationStudents = ({
  filteredStudents,
  studentToTargetCourseDateMap,
  dataExport,
  contentToInclude,
  coursecode = [],
  variant,
  studyGuidanceGroup,
  customPopulationProgramme,
  from,
  to,
  criteria,
  year,
  curriculum,
}) => {
  const [state, setState] = useState({})
  const studentRef = useRef()
  const dispatch = useDispatch()
  const { data: tags } = useSelector(({ tags }) => tags)
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
    // eslint-disable-next-line prefer-destructuring
    mainProgramme = programmes[0]
    combinedProgramme = programmes.length > 1 ? programmes[1] : ''
  }

  const { isAdmin } = useGetAuthorizedUserQuery()
  const admin = isAdmin

  useEffect(() => {
    if (tags && tags.length > 0) return
    // Create studytrack for fetching tags for class statistics
    const correctCode = combinedProgramme ? `${mainProgramme}+${combinedProgramme}` : mainProgramme
    if (correctCode) {
      dispatch(getTagsByStudytrackAction(correctCode))
      dispatch(getStudentTagsByStudytrackAction(correctCode))
    }

    setState({ ...state, admin })
  }, [])

  if (filteredStudents.length === 0) return null
  return (
    <>
      <span ref={studentRef} style={{ marginRight: '0.5rem' }}>
        <InfoBox content={contentToInclude.infotoolTipContent} />
      </span>
      {admin ? <CheckStudentList students={filteredStudents.map(stu => stu.studentNumber)} /> : null}
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
        tags={tags}
        to={to}
        variant={variant}
        visiblePanes={contentToInclude.panesToInclude}
        year={year}
      />
    </>
  )
}

const getTabs = programmeCode => {
  if (programmeCode && (programmeCode.includes('KH') || ['MH30_001', 'MH30_003'].includes(programmeCode)))
    return ['General', 'Courses', 'Progress']
  if (programmeCode) return ['General', 'Courses']
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
          ? ['General', 'Courses', 'Tags']
          : ['General', 'Courses', 'Tags', 'Progress'],
      infotoolTipContent: populationStatisticsToolTips.StudentsClass,
    },
    coursePopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: coursePopulationToolTips.Students,
    },
    customPopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: populationStatisticsToolTips.StudentsCustom,
    },
    studyGuidanceGroupPopulation: {
      panesToInclude: getTabs(props.studyGuidanceGroup?.tags?.studyProgramme),
      infotoolTipContent: populationStatisticsToolTips.StudentsGuidanceGroups,
    },
  }

  return <PopulationStudents contentToInclude={contentByVariant[variant]} {...props} />
}
