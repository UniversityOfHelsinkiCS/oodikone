import React, { Suspense } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

import { SegmentDimmer } from 'components/SegmentDimmer'
import { ProtectedRoute } from './ProtectedRoute'

import { FrontPage } from '../Frontpage'
import { Feedback } from '../Feedback'
import { PopulationStatistics } from '../PopulationStatistics'
import { FacultyStatistics } from '../FacultyStatistics'
import { StudyProgramme } from '../StudyProgramme'
import { StudentStatistics } from '../StudentStatistics'
import { CourseStatistics } from '../CourseStatistics'
import { Users } from '../Users'
import { Teachers } from '../Teachers'
import { CoursePopulation } from '../CoursePopulation'
import { CustomPopulation } from '../CustomPopulation'
import { CustomOpenUniPopulation } from '../CustomOpenUniPopulation'
import { CompletedCourses } from '../CompletedCoursesSearch'
import { Updater } from '../Updater'
import { StudyGuidanceGroups } from '../StudyGuidanceGroups'
import { LanguageCenterView } from '../LanguageCenterView'
import { EvaluationOverview } from '../EvaluationOverview'
import { UniversityViewPage } from '../EvaluationOverview/UniversityView'

const routes = {
  students: '/students/:studentNumber?',
  courseStatistics: '/coursestatistics',
  teachers: '/teachers/:teacherid?',
  users: '/users/:userid?',
  feedback: '/feedback',
  coursepopulation: '/coursepopulation',
  custompopulation: '/custompopulation',
  updater: '/updater',
  studyGuidanceGroups: '/studyguidancegroups/:groupid?',
  faculties: '/faculties/:facultyCode?',
  customOpenUniPopulation: '/openunipopulation',
  evaluationOverview: '/evaluationoverview/:level?/:id?',
  university: '/university',
  completedCoursesSearch: '/completedcoursessearch',
  languageCenterView: '/languagecenterview',
}

export const Routes = () => (
  <Suspense fallback={<SegmentDimmer isLoading />}>
    <Switch>
      <Route exact path="/" component={FrontPage} />
      <Route exact path={routes.feedback} component={Feedback} />
      <ProtectedRoute requireUserHasRights exact path="/populations" component={PopulationStatistics} />
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
        component={CustomOpenUniPopulation}
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
      <ProtectedRoute requireUserHasRights exact path={routes.university} component={UniversityViewPage} />
      <Redirect to="/" />
    </Switch>
  </Suspense>
)
