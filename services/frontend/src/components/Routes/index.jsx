import React, { Suspense } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { CompletedCourses } from '@/components/CompletedCoursesSearch'
import { CoursePopulation } from '@/components/CoursePopulation'
import { CourseStatistics } from '@/components/CourseStatistics'
import { CustomOpenUniPopulation } from '@/components/CustomOpenUniPopulation'
import { CustomPopulation } from '@/components/CustomPopulation'
import { EvaluationOverview } from '@/components/EvaluationOverview'
import { UniversityViewPage } from '@/components/EvaluationOverview/UniversityView'
import { FacultyStatistics } from '@/components/FacultyStatistics'
import { Feedback } from '@/components/Feedback'
import { FrontPage } from '@/components/Frontpage'
import { LanguageCenterView } from '@/components/LanguageCenterView'
import { PopulationStatistics } from '@/components/PopulationStatistics'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { StudentStatistics } from '@/components/StudentStatistics'
import { StudyGuidanceGroups } from '@/components/StudyGuidanceGroups'
import { StudyProgramme } from '@/components/StudyProgramme'
import { Teachers } from '@/components/Teachers'
import { Updater } from '@/components/Updater'
import { Users } from '@/components/Users'
import { ProtectedRoute } from './ProtectedRoute'

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
