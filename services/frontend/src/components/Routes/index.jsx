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
import { languageCenterViewEnabled } from '@/conf'
import { Feedback } from '@/pages/Feedback'
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
}

export const Routes = () => (
  <Suspense fallback={<SegmentDimmer isLoading />}>
    <Switch>
      <Route component={FrontPage} exact path="/" />
      {isDefaultServiceProvider() && <Route component={Feedback} exact path={routes.feedback} />}
      <ProtectedRoute
        component={PopulationStatistics}
        exact
        path={routes.populations}
        requireUserHasRights
        requiredRoles={['fullSisuAccess']}
      />
      <ProtectedRoute
        component={FacultyStatistics}
        exact
        path={routes.faculties}
        requiredRoles={['admin', 'fullSisuAccess', 'facultyStatistics']}
      />
      <ProtectedRoute
        component={StudyProgramme}
        exact
        path={routes.studyProgramme}
        requireUserHasRights
        requiredRoles={['fullSisuAccess']}
      />
      <ProtectedRoute
        component={StudentStatistics}
        exact
        path={routes.students}
        requireUserHasRights
        requiredRoles={['admin', 'fullSisuAccess', 'studyGuidanceGroups']}
      />
      <ProtectedRoute
        component={CourseStatistics}
        exact
        path={routes.courseStatistics}
        requireUserHasRights
        requiredRoles={['fullSisuAccess', 'courseStatistics']}
      />
      <ProtectedRoute component={Users} exact path={routes.users} requiredRoles={['admin']} />
      <ProtectedRoute component={Teachers} exact path={routes.teachers} requiredRoles={['teachers']} />
      {isDefaultServiceProvider() && (
        <ProtectedRoute
          component={CoursePopulation}
          exact
          path={routes.coursepopulation}
          requireUserHasRights
          requiredRoles={['fullSisuAccess']}
        />
      )}
      <ProtectedRoute
        component={CustomPopulation}
        exact
        path={routes.custompopulation}
        requireUserHasRights
        requiredRoles={['admin', 'fullSisuAccess', 'studyGuidanceGroups']}
      />
      {isDefaultServiceProvider() && (
        <ProtectedRoute
          component={CustomOpenUniPopulation}
          exact
          path={routes.customOpenUniPopulation}
          requiredRoles={['admin', 'openUniSearch']}
        />
      )}
      <ProtectedRoute component={CompletedCourses} exact path={routes.completedCoursesSearch} />
      <ProtectedRoute component={Updater} exact path={routes.updater} requireUserHasRights requiredRoles={['admin']} />
      <ProtectedRoute
        component={StudyGuidanceGroups}
        exact
        path={routes.studyGuidanceGroups}
        requiredRoles={['studyGuidanceGroups']}
      />
      {languageCenterViewEnabled && (
        <ProtectedRoute
          component={LanguageCenterView}
          exact
          path={routes.languageCenterView}
          requireUserHasRights
          requiredRoles={['admin']}
        />
      )}
      <ProtectedRoute
        component={EvaluationOverview}
        exact
        path={routes.evaluationOverview}
        requiredRoles={['admin', 'fullSisuAccess', 'katselmusViewer']}
      />
      <ProtectedRoute component={UniversityViewPage} exact path={routes.university} />
      <ProtectedRoute
        component={CloseToGraduation}
        exact
        path={routes.closeToGraduation}
        requiredRoles={['fullSisuAccess', 'studyGuidanceGroups']}
      />
      <Redirect to="/" />
    </Switch>
  </Suspense>
)
