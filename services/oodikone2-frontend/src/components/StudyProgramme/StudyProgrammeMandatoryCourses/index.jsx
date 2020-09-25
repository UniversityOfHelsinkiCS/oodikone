import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { func, shape, string, bool } from 'prop-types'
import { Message, Tab } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import {
  getMandatoryCourses as getMandatoryCoursesAction,
  addMandatoryCourse as addMandatoryCourseAction,
  deleteMandatoryCourse as deleteMandatoryCourseAction,
  setMandatoryCourseLabel as setMandatoryCourseLabelAction
} from '../../../redux/populationMandatoryCourses'
import MandatoryCourseTable from '../MandatoryCourseTable'
import NewMandatoryCourseTable from '../NewMandatoryCourses'
import AddMandatoryCourses from '../AddMandatoryCourses'
import MandatoryCourseLabels from '../MandatoryCourseLabels'
import { useTabs } from '../../../common/hooks'
import { getUserIsAdmin } from '../../../common'

const StudyProgrammeMandatoryCourses = props => {
  const {
    getMandatoryCourses,
    addMandatoryCourse,
    deleteMandatoryCourse,
    setMandatoryCourseLabel,
    studyProgramme,
    mandatoryCourses,
    history,
    isAdmin
  } = props
  const [tab, setTab] = useTabs('p_m_tab', 0, history)
  useEffect(() => {
    if (studyProgramme) {
      getMandatoryCourses(studyProgramme)
    }
  }, [studyProgramme])

  if (!studyProgramme) return null

  const panes = [
    {
      menuItem: 'Mandatory courses',
      render: () => (
        <Tab.Pane>
          <AddMandatoryCourses addMandatoryCourse={addMandatoryCourse} studyProgramme={studyProgramme} />
          <MandatoryCourseTable
            mandatoryCourses={mandatoryCourses.data}
            studyProgramme={studyProgramme}
            deleteMandatoryCourse={deleteMandatoryCourse}
            setMandatoryCourseLabel={setMandatoryCourseLabel}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: 'Group labels',
      render: () => (
        <Tab.Pane>
          <MandatoryCourseLabels studyProgramme={studyProgramme} getMandatoryCourses={getMandatoryCourses} />
        </Tab.Pane>
      )
    }
  ]

  if (isAdmin)
    panes.push({
      menuItem: 'New Mand. Courses',
      render: () => <NewMandatoryCourseTable studyProgramme={studyProgramme} />
    })

  return (
    <React.Fragment>
      <Message
        content="The set of mandatory courses which can be used in population filtering
            in the 'Study programme' > 'Search by class' results page. The label is used to group the courses in different views.
            You can for example use labels '1. year', '2. year' to define groups of 1st year and second year mandatory courses."
      />
      <Tab activeIndex={tab} panes={panes} onTabChange={setTab} />
    </React.Fragment>
  )
}

StudyProgrammeMandatoryCourses.propTypes = {
  getMandatoryCourses: func.isRequired,
  addMandatoryCourse: func.isRequired,
  deleteMandatoryCourse: func.isRequired,
  setMandatoryCourseLabel: func.isRequired,
  studyProgramme: string.isRequired,
  mandatoryCourses: shape({}).isRequired,
  history: shape({}).isRequired,
  isAdmin: bool.isRequired
}

const mapStateToProps = ({
  populationMandatoryCourses,
  auth: {
    token: { roles }
  }
}) => ({
  isAdmin: getUserIsAdmin(roles),
  mandatoryCourses: populationMandatoryCourses
})

const mapDispatchToProps = {
  getMandatoryCourses: getMandatoryCoursesAction,
  addMandatoryCourse: addMandatoryCourseAction,
  deleteMandatoryCourse: deleteMandatoryCourseAction,
  setMandatoryCourseLabel: setMandatoryCourseLabelAction
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(StudyProgrammeMandatoryCourses))
