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
import { CloseToGraduation } from '../CloseToGraduation'
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
  closeToGraduation: '/close-to-graduation',
}

export const Routes = () => (
  <Suspense fallback={<SegmentDimmer isLoading />}>
    <Switch>
      <Route component={FrontPage} exact path="/" />
      <Route component={Feedback} exact path={routes.feedback} />
      <ProtectedRoute component={PopulationStatistics} exact path="/populations" requireUserHasRights />
      <ProtectedRoute
        component={FacultyStatistics}
        exact
        path={routes.faculties}
        requiredRoles={['admin', 'facultyStatistics']}
      />
      <ProtectedRoute
        component={StudyProgramme}
        exact
        path="/study-programme/:studyProgrammeId?"
        requireUserHasRights
      />
      <ProtectedRoute
        component={StudentStatistics}
        exact
        path={routes.students}
        requireUserHasRights
        requiredRoles={['admin', 'studyGuidanceGroups']}
      />
      <ProtectedRoute
        component={CourseStatistics}
        exact
        path={routes.courseStatistics}
        requireUserHasRights
        requiredRoles={['courseStatistics']}
      />
      <ProtectedRoute component={Users} exact path={routes.users} requiredRoles={['admin']} />
      <ProtectedRoute component={Teachers} exact path={routes.teachers} requiredRoles={['teachers']} />
      <ProtectedRoute component={CoursePopulation} exact path={routes.coursepopulation} requireUserHasRights />
      <ProtectedRoute
        component={CustomPopulation}
        exact
        path={routes.custompopulation}
        requireUserHasRights
        requiredRoles={['admin', 'studyGuidanceGroups']}
      />
      <ProtectedRoute
        component={CustomOpenUniPopulation}
        exact
        path={routes.customOpenUniPopulation}
        requiredRoles={['admin', 'openUniSearch']}
      />
      <ProtectedRoute component={CompletedCourses} exact path={routes.completedCoursesSearch} />
      <ProtectedRoute component={Updater} exact path={routes.updater} requireUserHasRights requiredRoles={['admin']} />
      <ProtectedRoute
        component={StudyGuidanceGroups}
        exact
        path={routes.studyGuidanceGroups}
        requiredRoles={['studyGuidanceGroups']}
      />
      <ProtectedRoute
        component={LanguageCenterView}
        exact
        path={routes.languageCenterView}
        requireUserHasRights
        requiredRoles={['admin']}
      />
      <ProtectedRoute component={EvaluationOverview} exact path={routes.evaluationOverview} requireUserHasRights />
      <ProtectedRoute component={UniversityViewPage} exact path={routes.university} requireUserHasRights />
      <ProtectedRoute
        component={CloseToGraduation}
        exact
        path={routes.closeToGraduation}
        requireUserHasRights
        requiredRoles={['admin']}
      />
      <Redirect to="/" />
    </Switch>
  </Suspense>
)
