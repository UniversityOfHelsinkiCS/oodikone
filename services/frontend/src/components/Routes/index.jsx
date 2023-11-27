import React, { Suspense } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

import { SegmentDimmer } from 'components/SegmentDimmer'
import { ProtectedRoute } from './ProtectedRoute'

// From https://dev.to/goenning/how-to-retry-when-react-lazy-fails-mb5
const retry = async (fn, retriesLeft = 3, interval = 500) =>
  new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch(error => {
        if (retriesLeft <= 1) {
          if (error && error.message && error.message.match(/loading.+chunk.+failed/gi)) {
            // We probably made a release which deletes old js and css
            // lazy load thus fails and user must reload page
            resolve(null)
            window.location.reload()
          } else {
            reject(error)
          }
          return
        }
        setTimeout(() => {
          retry(fn, retriesLeft - 1, interval).then(resolve, reject)
        }, interval)
      })
  })

const FrontPage = React.lazy(() => retry(() => import('../Frontpage').then(module => ({ default: module.FrontPage }))))
const Populations = React.lazy(() =>
  retry(() => import('../PopulationStatistics').then(module => ({ default: module.PopulationStatistics })))
)
const StudentStatistics = React.lazy(() =>
  retry(() => import('../StudentStatistics').then(module => ({ default: module.StudentStatistics })))
)
const CourseStatistics = React.lazy(() =>
  retry(() => import('../CourseStatistics').then(module => ({ default: module.CourseStatistics })))
)
const Users = React.lazy(() => retry(() => import('../Users').then(module => ({ default: module.Users }))))
const StudyProgramme = React.lazy(() =>
  retry(() => import('../StudyProgramme').then(module => ({ default: module.StudyProgramme })))
)
const Teachers = React.lazy(() => retry(() => import('../Teachers').then(module => ({ default: module.Teachers }))))
const Feedback = React.lazy(() => retry(() => import('../Feedback').then(module => ({ default: module.Feedback }))))
const CoursePopulation = React.lazy(() =>
  retry(() => import('../CoursePopulation').then(module => ({ default: module.CoursePopulation })))
)
const CustomPopulation = React.lazy(() =>
  retry(() => import('../CustomPopulation').then(module => ({ default: module.CustomPopulation })))
)
const Updater = React.lazy(() => retry(() => import('../Updater').then(module => ({ default: module.Updater }))))
const Trends = React.lazy(() => retry(() => import('../Trends').then(module => ({ default: module.Trends }))))
const StudyGuidanceGroups = React.lazy(() =>
  retry(() => import('../StudyGuidanceGroups').then(module => ({ default: module.StudyGuidanceGroups })))
)
const FacultyStatistics = React.lazy(() =>
  retry(() => import('../FacultyStatistics').then(module => ({ default: module.FacultyStatistics })))
)
const CustomOpenUniPopulations = React.lazy(() =>
  retry(() => import('../CustomOpenUniPopulation').then(module => ({ default: module.CustomOpenUniPopulation })))
)
const EvaluationOverview = React.lazy(() =>
  retry(() => import('../EvaluationOverview').then(module => ({ default: module.EvaluationOverview })))
)
const CompletedCourses = React.lazy(() =>
  retry(() => import('../CompletedCoursesSearch').then(module => ({ default: module.CompletedCourses })))
)
const LanguageCenterView = React.lazy(() =>
  retry(() => import('../LanguageCenterView').then(module => ({ default: module.LanguageCenterView })))
)

const routes = {
  students: '/students/:studentNumber?',
  courseStatistics: '/coursestatistics',
  teachers: '/teachers/:teacherid?',
  users: '/users/:userid?',
  feedback: '/feedback',
  coursepopulation: '/coursepopulation',
  custompopulation: '/custompopulation',
  updater: '/updater',
  trends: '/trends',
  studyGuidanceGroups: '/studyguidancegroups/:groupid?',
  faculties: '/faculties/:facultyCode?',
  customOpenUniPopulation: '/openunipopulation',
  evaluationOverview: '/evaluationoverview/:level?/:id?',
  completedCoursesSearch: '/completedcoursessearch',
  languageCenterView: '/languagecenterview',
}

export const Routes = () => (
  <Suspense fallback={<SegmentDimmer isLoading />}>
    <Switch>
      <Route exact path="/" component={FrontPage} />
      <Route exact path={routes.feedback} component={Feedback} />
      <Route path={routes.trends} component={Trends} />
      <ProtectedRoute requireUserHasRights exact path="/populations" component={Populations} />
      <ProtectedRoute
        requiredRoles={['admin', 'facultyStatistics']}
        exact
        path={routes.faculties}
        component={FacultyStatistics}
      />
      <ProtectedRoute
        requireUserHasRights
        exact
        path="/study-programme/:studyProgrammeId?"
        component={StudyProgramme}
      />
      <ProtectedRoute
        requiredRoles={['admin', 'studyGuidanceGroups']}
        requireUserHasRights
        exact
        path={routes.students}
        component={StudentStatistics}
      />
      <ProtectedRoute
        requiredRoles={['courseStatistics']}
        requireUserHasRights
        exact
        path={routes.courseStatistics}
        component={CourseStatistics}
      />
      <ProtectedRoute requiredRoles={['admin']} exact path={routes.users} component={Users} />
      <ProtectedRoute requiredRoles={['teachers']} exact path={routes.teachers} component={Teachers} />
      <ProtectedRoute requireUserHasRights exact path={routes.coursepopulation} component={CoursePopulation} />
      <ProtectedRoute
        requiredRoles={['admin', 'studyGuidanceGroups']}
        requireUserHasRights
        exact
        path={routes.custompopulation}
        component={CustomPopulation}
      />
      <ProtectedRoute
        requiredRoles={['admin', 'openUniSearch']}
        exact
        path={routes.customOpenUniPopulation}
        component={CustomOpenUniPopulations}
      />
      <ProtectedRoute exact path={routes.completedCoursesSearch} component={CompletedCourses} />
      <ProtectedRoute requiredRoles={['admin']} requireUserHasRights exact path={routes.updater} component={Updater} />
      <ProtectedRoute
        requiredRoles={['studyGuidanceGroups']}
        exact
        path={routes.studyGuidanceGroups}
        component={StudyGuidanceGroups}
      />
      <ProtectedRoute
        requiredRoles={['admin']}
        requireUserHasRights
        exact
        path={routes.languageCenterView}
        component={LanguageCenterView}
      />
      <ProtectedRoute requireUserHasRights exact path={routes.evaluationOverview} component={EvaluationOverview} />
      <Redirect from="/cool-data-science" to="/trends" />
      <Redirect to="/" />
    </Switch>
  </Suspense>
)
