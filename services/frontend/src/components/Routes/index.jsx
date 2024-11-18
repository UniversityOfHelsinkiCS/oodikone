import { Suspense } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { isDefaultServiceProvider } from '@/common'
import { CloseToGraduation } from '@/components/CloseToGraduation'
import { CompletedCourses } from '@/components/CompletedCoursesSearch'
import { CoursePopulation } from '@/components/CoursePopulation'
import { CourseStatistics } from '@/components/CourseStatistics'
import { CustomOpenUniPopulation } from '@/components/CustomOpenUniPopulation'
import { CustomPopulation } from '@/components/CustomPopulation'
import { EvaluationOverview } from '@/components/EvaluationOverview'
import { UniversityViewPage } from '@/components/EvaluationOverview/UniversityView'
import { FacultyStatistics } from '@/components/FacultyStatistics'
import { LanguageCenterView } from '@/components/LanguageCenterView'
import { PopulationStatistics } from '@/components/PopulationStatistics'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { StudentStatistics } from '@/components/StudentStatistics'
import { StudyGuidanceGroups } from '@/components/StudyGuidanceGroups'
import { StudyProgramme } from '@/components/StudyProgramme'
import { Teachers } from '@/components/Teachers'
import { Updater } from '@/components/Updater'
import { Users } from '@/components/Users'
import { languageCenterViewEnabled } from '@/conf'
import { Changelog } from '@/pages/Changelog'
import { Feedback } from '@/pages/Feedback'
import { FrontPage } from '@/pages/FrontPage'
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
  faculties: '/faculties/:facultyId?',
  customOpenUniPopulation: '/openunipopulation',
  evaluationOverview: '/evaluationoverview/:level?/:id?',
  university: '/university',
  completedCoursesSearch: '/completedcoursessearch',
  languageCenterView: '/languagecenterview',
  closeToGraduation: '/close-to-graduation',
  populations: '/populations',
  studyProgramme: '/study-programme/:studyProgrammeId?',
  changelog: '/changelog',
}

export const Routes = () => (
  <Suspense fallback={<SegmentDimmer isLoading />}>
    <Switch>
      <Route component={FrontPage} exact path="/" />
      <Route component={Changelog} exact path={routes.changelog} />
      {isDefaultServiceProvider() && <Route component={Feedback} exact path={routes.feedback} />}
      <ProtectedRoute
        component={PopulationStatistics}
        path={routes.populations}
        requireUserHasRights
        requiredRoles={['fullSisuAccess']}
      />
      <ProtectedRoute
        component={FacultyStatistics}
        path={routes.faculties}
        requiredRoles={['admin', 'fullSisuAccess', 'facultyStatistics']}
      />
      <ProtectedRoute
        component={StudyProgramme}
        path={routes.studyProgramme}
        requireUserHasRights
        requiredRoles={['fullSisuAccess']}
      />
      <ProtectedRoute
        component={StudentStatistics}
        path={routes.students}
        requireUserHasRights
        requiredRoles={['admin', 'fullSisuAccess', 'studyGuidanceGroups']}
      />
      <ProtectedRoute
        component={CourseStatistics}
        path={routes.courseStatistics}
        requireUserHasRights
        requiredRoles={['fullSisuAccess', 'courseStatistics']}
      />
      <ProtectedRoute component={Users} path={routes.users} requiredRoles={['admin']} />
      <ProtectedRoute component={Teachers} path={routes.teachers} requiredRoles={['teachers']} />
      <ProtectedRoute
        component={CoursePopulation}
        path={routes.coursepopulation}
        requireUserHasRights
        requiredRoles={['fullSisuAccess']}
      />
      <ProtectedRoute
        component={CustomPopulation}
        path={routes.custompopulation}
        requireUserHasRights
        requiredRoles={['admin', 'fullSisuAccess', 'studyGuidanceGroups']}
      />
      {isDefaultServiceProvider() && (
        <ProtectedRoute
          component={CustomOpenUniPopulation}
          path={routes.customOpenUniPopulation}
          requiredRoles={['admin', 'openUniSearch']}
        />
      )}
      <ProtectedRoute component={CompletedCourses} path={routes.completedCoursesSearch} />
      <ProtectedRoute component={Updater} path={routes.updater} requireUserHasRights requiredRoles={['admin']} />
      <ProtectedRoute
        component={StudyGuidanceGroups}
        path={routes.studyGuidanceGroups}
        requiredRoles={['studyGuidanceGroups']}
      />
      {languageCenterViewEnabled && (
        <ProtectedRoute
          component={LanguageCenterView}
          path={routes.languageCenterView}
          requireUserHasRights
          requiredRoles={['admin']}
        />
      )}
      <ProtectedRoute
        component={EvaluationOverview}
        path={routes.evaluationOverview}
        requiredRoles={['admin', 'fullSisuAccess', 'katselmusViewer']}
      />
      <ProtectedRoute component={UniversityViewPage} path={routes.university} />
      <ProtectedRoute
        component={CloseToGraduation}
        path={routes.closeToGraduation}
        requiredRoles={['fullSisuAccess', 'studyGuidanceGroups']}
      />
      <Redirect to="/" />
    </Switch>
  </Suspense>
)
