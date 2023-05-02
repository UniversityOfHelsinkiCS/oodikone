import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tab, Grid, Dropdown } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import scrollToComponent from 'react-scroll-to-component'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import moment from 'moment'
import { useTabChangeAnalytics, usePrevious } from '../../common/hooks'

import { getTagsByStudytrackAction } from '../../redux/tags'
import { getStudentTagsByStudytrackAction } from '../../redux/tagstudent'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import '../PopulationCourseStats/populationCourseStats.css'
import InfoBox from '../Info/InfoBox'
import CheckStudentList from './CheckStudentList'
import TagPopulation from '../TagPopulation'
import TagList from '../TagList'
import ProgressTable from './ProgressTable'
import './populationStudents.css'
import GeneralTab from './StudentTable/GeneralTab'
import sendEvent, { ANALYTICS_CATEGORIES } from '../../common/sendEvent'
import infotoolTips from '../../common/InfoToolTips'
import CoursesTable from './StudentTable/CourseTab'

const sendAnalytics = sendEvent.populationStudents

const Panes = ({
  filteredStudents,
  tags,
  visiblePanes,
  dataExport,
  variant,
  studentToTargetCourseDateMap,
  coursecode,
  studyGuidanceGroup,
  queryStudyrights,
  from,
  to,
  criteria,
  months,
}) => {
  const { handleTabChange } = useTabChangeAnalytics(
    ANALYTICS_CATEGORIES.populationStudents,
    'Change students table tab'
  )

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
            studyGuidanceGroup={studyGuidanceGroup}
            from={from}
            to={to}
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Courses',
      render: () => (
        <CoursesTable students={filteredStudents} variant={variant} studyGuidanceGroup={studyGuidanceGroup} />
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
                  <Link
                    to={`/study-programme/${queryStudyrights[0]}?p_m_tab=0&p_tab=4`}
                    onClick={() => {
                      sendAnalytics('No tags defined button clicked', 'Tags tab')
                    }}
                  >
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
                  studytrack={queryStudyrights[0]}
                />
                <TagList studytrack={queryStudyrights[0]} selectedStudents={filteredStudents} />
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
          programme={queryStudyrights[0] || programme}
          studyGuidanceGroupProgramme={programme}
        />
      ),
    },
  ]

  const panes = panesAvailable.filter(pane => visiblePanes.includes(pane.menuItem))

  return (
    <>
      <Grid columns="two">
        <Grid.Column>
          <StudentNameVisibilityToggle />
        </Grid.Column>
        {dataExport && (
          <Grid.Column textAlign="right">
            <Dropdown text="Export Data" icon="save" button labeled className="icon" direction="left">
              <Dropdown.Menu>{dataExport}</Dropdown.Menu>
            </Dropdown>
          </Grid.Column>
        )}
      </Grid>
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
  from,
  to,
  criteria,
}) => {
  const [state, setState] = useState({})
  const studentRef = useRef()
  const dispatch = useDispatch()
  const { studentlistVisible: showList } = useSelector(({ settings }) => settings)
  const { data: tags } = useSelector(({ tags }) => tags)
  const { query } = useSelector(({ populations }) => populations)
  const queryStudyrights = query ? Object.values(query.studyRights) : []
  let months = query ? query.months : 0
  if (studyGuidanceGroup && studyGuidanceGroup?.tags?.year) {
    months = moment(`${studyGuidanceGroup?.tags?.year}-08-01`).diff(moment(), 'months')
  }
  const prevShowList = usePrevious(showList)
  const { isAdmin } = useGetAuthorizedUserQuery()
  const admin = isAdmin

  useEffect(() => {
    if (tags && tags.length > 0) return
    const queryStudyright = queryStudyrights[0]

    if (queryStudyright) {
      dispatch(getTagsByStudytrackAction(queryStudyright))
      dispatch(getStudentTagsByStudytrackAction(queryStudyright))
    }

    setState({ ...state, admin })
  }, [])

  useEffect(() => {
    if (!prevShowList && showList) {
      scrollToComponent(studentRef.current, { align: 'bottom' })
    }
  }, [prevShowList])

  if (filteredStudents.length === 0) return null
  return (
    <>
      <span style={{ marginRight: '0.5rem' }} ref={studentRef}>
        <InfoBox content={contentToInclude.infotoolTipContent} />
      </span>
      {admin ? <CheckStudentList students={filteredStudents.map(stu => stu.studentNumber)} /> : null}
      <Panes
        filteredStudents={filteredStudents}
        queryStudyrights={queryStudyrights}
        visiblePanes={contentToInclude.panesToInclude}
        dataExport={dataExport}
        variant={variant}
        studentToTargetCourseDateMap={studentToTargetCourseDateMap}
        tags={tags}
        criteria={criteria}
        studyGuidanceGroup={studyGuidanceGroup}
        coursecode={coursecode}
        from={from}
        to={to}
        months={months}
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

const PopulationStudentsContainer = ({ ...props }) => {
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
      infotoolTipContent: infotoolTips.PopulationStatistics.StudentsClass,
    },
    coursePopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: infotoolTips.CoursePopulation.Students,
    },
    customPopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: infotoolTips.PopulationStatistics.StudentsCustom,
    },
    studyGuidanceGroupPopulation: {
      panesToInclude: getTabs(props.studyGuidanceGroup?.tags?.studyProgramme),
      infotoolTipContent: infotoolTips.PopulationStatistics.StudentsGuidanceGroups,
    },
  }

  return <PopulationStudents contentToInclude={contentByVariant[variant]} {...props} />
}

export default PopulationStudentsContainer
