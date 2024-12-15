import { Suspense } from 'react'
import { Navigate, Route, Routes as RouterRoutes } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { CompletedCourses } from '@/components/CompletedCoursesSearch'
import { CoursePopulation } from '@/components/CoursePopulation'
import { CourseStatistics } from '@/components/CourseStatistics'
import { CustomOpenUniPopulation } from '@/components/CustomOpenUniPopulation'
import { CustomPopulation } from '@/components/CustomPopulation'
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
import { CloseToGraduation } from '@/pages/CloseToGraduation'
import { Faculties } from '@/pages/Faculties'
import { Feedback } from '@/pages/Feedback'
import { FrontPage } from '@/pages/FrontPage'
import { University } from '@/pages/University'
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
    <RouterRoutes>
      {/* Public routes */}
      <Route element={<FrontPage />} path="/" />
      <Route element={<Changelog />} path={routes.changelog} />
      {isDefaultServiceProvider() && <Route element={<Feedback />} path={routes.feedback} />}

      {/* Full Sisu Access Routes */}
      <Route element={<ProtectedRoute requireUserHasRights requiredRoles={['fullSisuAccess']} />}>
        <Route element={<PopulationStatistics />} path={routes.populations} />
        <Route element={<StudyProgramme />} path={routes.studyProgramme} />
        {isDefaultServiceProvider() && <Route element={<CoursePopulation />} path={routes.coursepopulation} />}
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
        <Route element={<Users />} path={routes.users} />
      </Route>

      {/* Admin with Rights Routes */}
      <Route element={<ProtectedRoute requireUserHasRights requiredRoles={['admin']} />}>
        <Route element={<Updater />} path={routes.updater} />
        {languageCenterViewEnabled && <Route element={<LanguageCenterView />} path={routes.languageCenterView} />}
      </Route>

      {/* Course Statistics Routes */}
      <Route element={<ProtectedRoute requireUserHasRights requiredRoles={['fullSisuAccess', 'courseStatistics']} />}>
        <Route element={<CourseStatistics />} path={routes.courseStatistics} />
      </Route>

      {/* Faculty Statistics Routes */}
      <Route element={<ProtectedRoute requiredRoles={['admin', 'fullSisuAccess', 'facultyStatistics']} />}>
        <Route element={<Faculties />} path={routes.faculties} />
      </Route>

      {/* Student Access Routes */}
      <Route
        element={
          <ProtectedRoute requireUserHasRights requiredRoles={['admin', 'fullSisuAccess', 'studyGuidanceGroups']} />
        }
      >
        <Route element={<StudentStatistics />} path={routes.students} />
        <Route element={<CustomPopulation />} path={routes.custompopulation} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute requiredRoles={['teachers']} />}>
        <Route element={<Teachers />} path={routes.teachers} />
      </Route>

      {/* Study Guidance Routes */}
      <Route element={<ProtectedRoute requiredRoles={['studyGuidanceGroups']} />}>
        <Route element={<StudyGuidanceGroups />} path={routes.studyGuidanceGroups} />
      </Route>

      {/* Close to Graduation Routes */}
      <Route element={<ProtectedRoute requiredRoles={['fullSisuAccess', 'studyGuidanceGroups']} />}>
        <Route element={<CloseToGraduation />} path={routes.closeToGraduation} />
      </Route>

      {/* OpenUni Routes */}
      {isDefaultServiceProvider() && (
        <Route element={<ProtectedRoute requiredRoles={['admin', 'openUniSearch']} />}>
          <Route element={<CustomOpenUniPopulation />} path={routes.customOpenUniPopulation} />
        </Route>
      )}

      {/* Basic Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<CompletedCourses />} path={routes.completedCoursesSearch} />
        <Route element={<University />} path={routes.university} />
      </Route>

      {/* Catch all route */}
      <Route element={<Navigate replace to="/" />} path="*" />
    </RouterRoutes>
  </Suspense>
)
