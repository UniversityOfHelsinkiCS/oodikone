import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { func, shape, string } from 'prop-types'
import { Message, Tab } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import {
  getMandatoryCourses,
  addMandatoryCourse,
  deleteMandatoryCourse,
  setMandatoryCourseLabel
} from '../../../redux/populationMandatoryCourses'
import MandatoryCourseTable from '../MandatoryCourseTable'
import AddMandatoryCourses from '../AddMandatoryCourses'
import MandatoryCourseLabels from '../MandatoryCourseLabels'
import { useTabs } from '../../../common'

const StudyProgrammeMandatoryCourses = (props) => {
  const [ tab, setTab ] = useTabs(
    'p_m_tab',
    0,
    props.history
  )

  useEffect(() => {
    const { studyProgramme } = props
    if (studyProgramme) {
      props.getMandatoryCourses(studyProgramme)
    }
  }, [ props.studyProgramme ])

  const { studyProgramme, mandatoryCourses, language } = props
  if (!studyProgramme) return null

  const panes = [
    {
      menuItem: 'Mandatory courses',
      render: () => (
        <Tab.Pane>
          <AddMandatoryCourses
            addMandatoryCourse={props.addMandatoryCourse}
            studyProgramme={studyProgramme}
          />
          <MandatoryCourseTable
            mandatoryCourses={mandatoryCourses.data}
            studyProgramme={studyProgramme}
            deleteMandatoryCourse={props.deleteMandatoryCourse}
            setMandatoryCourseLabel={props.setMandatoryCourseLabel}
            language={language}
          />
        </Tab.Pane>
      )
    },
    {
      menuItem: 'Group labels',
      render: () => (
        <Tab.Pane>
          <MandatoryCourseLabels
            studyProgramme={studyProgramme}
            getMandatoryCourses={props.getMandatoryCourses}
          />
        </Tab.Pane>
      )
    }
  ]

  return (
    <React.Fragment>
      <Message
        content="The set of mandatory courses which can be used in population filtering
            in the 'Study programme' > 'Search by class' results page. The label is used to group the courses in different views.
            You can for example use labels '1. year', '2. year' to define groups of 1st year and second year mandatory courses."
      />
      <Tab activeIndex={tab} panes={panes} onTabChange={setTab} />
    </React.Fragment >
  )
}

StudyProgrammeMandatoryCourses.propTypes = {
  getMandatoryCourses: func.isRequired,
  addMandatoryCourse: func.isRequired,
  deleteMandatoryCourse: func.isRequired,
  setMandatoryCourseLabel: func.isRequired,
  studyProgramme: string.isRequired,
  mandatoryCourses: shape({}).isRequired,
  language: string.isRequired,
  history: shape({}).isRequired
}

export default connect(
  ({ populationMandatoryCourses, settings }) => ({
    mandatoryCourses: populationMandatoryCourses,
    language: settings.language
  }),
  { getMandatoryCourses, addMandatoryCourse, deleteMandatoryCourse, setMandatoryCourseLabel }
)(withRouter(StudyProgrammeMandatoryCourses))
