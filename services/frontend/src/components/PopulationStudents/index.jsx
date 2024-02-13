import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tab } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import moment from 'moment'

import { useGetAuthorizedUserQuery } from 'redux/auth'
import { coursePopulationToolTips, populationStatisticsToolTips } from 'common/InfoToolTips'
import { useTabChangeAnalytics } from 'common/hooks'
import { getTagsByStudytrackAction } from 'redux/tags'
import { getStudentTagsByStudytrackAction } from 'redux/tagstudent'
import { StudentNameVisibilityToggle } from '../StudentNameVisibilityToggle'
import '../PopulationCourseStats/populationCourseStats.css'
import { InfoBox } from '../Info/InfoBox'
import { CheckStudentList } from './CheckStudentList'
import { ConnectedTagPopulation as TagPopulation } from '../TagPopulation'
import { ConnectedTagList as TagList } from '../TagList'
import { ProgressTable } from './StudentTable/ProgressTab'
import './populationStudents.css'
import { GeneralTabContainer as GeneralTab } from './StudentTable/GeneralTab'
import { CoursesTabContainer as CoursesTab } from './StudentTable/CourseTab'

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
            variant={variant}
            filteredStudents={filteredStudents}
            studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            coursecode={coursecode}
            customPopulationProgramme={customPopulationProgramme}
            studyGuidanceGroup={studyGuidanceGroup}
            from={from}
            to={to}
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
          variant={variant}
          studyGuidanceGroup={studyGuidanceGroup}
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
                  <Link to={`/study-programme/${programmeForTagsLink}?p_m_tab=0&p_tab=4`} onClick={() => {}}>
                    here
                  </Link>
                  .
                </h3>
              </div>
            )}
            {tags.length > 0 && (
              <>
                <TagPopulation
                  tags={tags}
                  selectedStudents={filteredStudents.map(stu => stu.studentNumber)}
                  mainProgramme={mainProgramme}
                  combinedProgramme={combinedProgramme}
                />
                <TagList
                  mainProgramme={mainProgramme}
                  selectedStudents={filteredStudents}
                  combinedProgramme={combinedProgramme}
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
          students={filteredStudents}
          criteria={criteria}
          months={months}
          curriculum={curriculum}
          programme={mainProgramme || programme}
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
      <Tab onTabChange={handleTabChange} panes={panes} data-cy="student-table-tabs" />
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
      <span style={{ marginRight: '0.5rem' }} ref={studentRef}>
        <InfoBox content={contentToInclude.infotoolTipContent} />
      </span>
      {admin ? <CheckStudentList students={filteredStudents.map(stu => stu.studentNumber)} /> : null}
      <Panes
        filteredStudents={filteredStudents}
        mainProgramme={mainProgramme}
        combinedProgramme={combinedProgramme}
        visiblePanes={contentToInclude.panesToInclude}
        dataExport={dataExport}
        variant={variant}
        studentToTargetCourseDateMap={studentToTargetCourseDateMap}
        tags={tags}
        criteria={criteria}
        studyGuidanceGroup={studyGuidanceGroup}
        customPopulationProgramme={customPopulationProgramme}
        coursecode={coursecode}
        from={from}
        to={to}
        months={months}
        year={year}
        curriculum={curriculum}
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
