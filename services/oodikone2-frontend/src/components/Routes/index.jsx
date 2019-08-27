import React, { Suspense } from 'react'
import { Route, Switch } from 'react-router-dom'
import { Loader } from 'semantic-ui-react'

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
const CoursePopulation = React.lazy(() => import('../CoursePopulation'))
const CustomPopulation = React.lazy(() => import('../CustomPopulation'))
const Updater = React.lazy(() => import('../Updater'))

const routes = {
  students: '/students/:studentNumber?',
  courseStatistics: '/coursestatistics',
  teachers: '/teachers/:teacherid?',
  users: '/users/:userid?',
  faculty: '/faculties/:facultyid?',
  usage: '/usage',
  sandbox: '/sandbox',
  oodilearn: '/oodilearn',
  feedback: '/feedback',
  coursepopulation: '/coursepopulation',
  custompopulation: '/custompopulation'
}

const Routes = () => (
  <Suspense fallback={<Loader active inline="centered" />}>
    <Switch>
      <Route exact path="/" component={WelcomePage} />
      <Route exact path="/populations" component={Populations} />
      <Route exact path="/study-programme/:studyProgrammeId?" component={StudyProgramme} />
      <Route exact path="/study-programme/:studyProgrammeId/course-group/:courseGroupId" component={StudyProgramme} />
      <Route exact path={routes.students} component={StudentStatistics} />
      <Route exact path={routes.courseStatistics} component={CourseStatistics} />
      <Route exact path={routes.faculty} component={Faculty} />
      <Route exact path={routes.users} component={EnableUsers} />
      <Route exact path={routes.teachers} component={Teachers} />
      <Route exact path={routes.usage} component={UsageStatistics} />
      <Route exact path={routes.sandbox} component={Sandbox} />
      <Route exact path={routes.oodilearn} component={OodiLearn} />
      <Route exact path={routes.feedback} component={Feedback} />
      <Route exact path={routes.coursepopulation} component={CoursePopulation} />
      <Route exact path={routes.custompopulation} component={CustomPopulation} />
      <Route exact path="/updater" component={Updater} />
    </Switch>
  </Suspense>
)

export default Routes
