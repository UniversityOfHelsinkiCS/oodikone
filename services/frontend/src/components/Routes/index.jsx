import { Suspense } from 'react'
import { Navigate, Route, Routes as RouterRoutes } from 'react-router-dom'

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
      <Route element={<FrontPage />} path="/" />
      <Route element={<Changelog />} path={routes.changelog} />
      {isDefaultServiceProvider() && <Route element={<Feedback />} path={routes.feedback} />}
      <Route
        element={
          <ProtectedRoute element={<PopulationStatistics />} requireUserHasRights requiredRoles={['fullSisuAccess']} />
        }
        path={routes.populations}
      />
      <Route
        element={
          <ProtectedRoute element={<Faculties />} requiredRoles={['admin', 'fullSisuAccess', 'facultyStatistics']} />
        }
        path={routes.faculties}
      />
      <Route
        element={
          <ProtectedRoute element={<StudyProgramme />} requireUserHasRights requiredRoles={['fullSisuAccess']} />
        }
        path={routes.studyProgramme}
      />
      <Route
        element={
          <ProtectedRoute
            element={<StudentStatistics />}
            requireUserHasRights
            requiredRoles={['admin', 'fullSisuAccess', 'studyGuidanceGroups']}
          />
        }
        path={routes.students}
      />
      <Route
        element={
          <ProtectedRoute
            element={<CourseStatistics />}
            requireUserHasRights
            requiredRoles={['fullSisuAccess', 'courseStatistics']}
          />
        }
        path={routes.courseStatistics}
      />
      <Route element={<ProtectedRoute element={<Users />} requiredRoles={['admin']} />} path={routes.users} />
      <Route element={<ProtectedRoute element={<Teachers />} requiredRoles={['teachers']} />} path={routes.teachers} />
      {isDefaultServiceProvider() && (
        <Route
          element={
            <ProtectedRoute element={<CoursePopulation />} requireUserHasRights requiredRoles={['fullSisuAccess']} />
          }
          path={routes.coursepopulation}
        />
      )}
      <Route
        element={
          <ProtectedRoute
            element={<CustomPopulation />}
            requireUserHasRights
            requiredRoles={['admin', 'fullSisuAccess', 'studyGuidanceGroups']}
          />
        }
        path={routes.custompopulation}
      />
      {isDefaultServiceProvider() && (
        <Route
          element={<ProtectedRoute element={<CustomOpenUniPopulation />} requiredRoles={['admin', 'openUniSearch']} />}
          path={routes.customOpenUniPopulation}
        />
      )}
      <Route element={<ProtectedRoute element={<CompletedCourses />} />} path={routes.completedCoursesSearch} />
      <Route
        element={<ProtectedRoute element={<Updater />} requireUserHasRights requiredRoles={['admin']} />}
        path={routes.updater}
      />
      <Route
        element={<ProtectedRoute element={<StudyGuidanceGroups />} requiredRoles={['studyGuidanceGroups']} />}
        path={routes.studyGuidanceGroups}
      />
      {languageCenterViewEnabled && (
        <Route
          element={<ProtectedRoute element={<LanguageCenterView />} requireUserHasRights requiredRoles={['admin']} />}
          path={routes.languageCenterView}
        />
      )}
      <Route element={<ProtectedRoute element={<University />} />} path={routes.university} />
      <Route
        element={
          <ProtectedRoute element={<CloseToGraduation />} requiredRoles={['fullSisuAccess', 'studyGuidanceGroups']} />
        }
        path={routes.closeToGraduation}
      />
      <Route element={<Navigate replace to="/" />} path="*" />
    </RouterRoutes>
  </Suspense>
)
