import React, { Suspense } from 'react'
import { Route, Switch } from 'react-router-dom'
import { Loader } from 'semantic-ui-react'
import { routes } from '../../constants'

const WelcomePage = React.lazy(() => import('../WelcomePage'))
const Populations = React.lazy(() => import('../PopulationStatistics'))
const StudentStatistics = React.lazy(() => import('../StudentStatistics'))
const CourseStatistics = React.lazy(() => import('../CourseStatistics'))
const EnableUsers = React.lazy(() => import('../EnableUsers'))
const StudyProgramme = React.lazy(() => import('../StudyProgramme'))
const Teachers = React.lazy(() => import('../Teachers'))
const Sandbox = React.lazy(() => import('../Sandbox'))
const UsageStatistics = React.lazy(() => import('../UsageStatistics'))
const OodiLearn = React.lazy(() => import('../OodiLearn'))
const Feedback = React.lazy(() => import('../Feedback'))
const Faculty = React.lazy(() => import('../Faculty'))
const CourseStudents = React.lazy(() => import('../CourseStudents'))

const Routes = () => (
  <Suspense fallback={<Loader active inline="centered" />}>
    <Switch>
      <Route exact path={routes.index.route} component={WelcomePage} />
      <Route exact path="/populations" component={Populations} />
      <Route exact path="/study-programme/:studyProgrammeId?" component={StudyProgramme} />
      <Route exact path="/study-programme/:studyProgrammeId/course-group/:courseGroupId" component={StudyProgramme} />
      <Route exact path={routes.students.route} component={StudentStatistics} />
      <Route exact path={routes.courseStatistics.route} component={CourseStatistics} />
      <Route exact path={routes.faculty.route} component={Faculty} />
      <Route exact path={routes.users.route} component={EnableUsers} />
      <Route exact path={routes.teachers.route} component={Teachers} />
      <Route exact path={routes.usage.route} component={UsageStatistics} />
      <Route exact path={routes.sandbox.route} component={Sandbox} />
      <Route exact path={routes.oodilearn.route} component={OodiLearn} />
      <Route exact path={routes.feedback.route} component={Feedback} />
      <Route exact path={routes.coursepopulation.route} component={CourseStudents} />
    </Switch>
  </Suspense>
)

export default Routes
