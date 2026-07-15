import { Suspense } from 'react'
import { Navigate, Route, Routes as RouterRoutes } from 'react-router'

import { CoursePopulation } from '@/components/CoursePopulation'
import { CustomPopulation } from '@/components/CustomPopulation'
import { LanguageCenterView } from '@/components/LanguageCenterView'
import { PopulationStatistics } from '@/components/PopulationStatistics'
import { ProtectedRoute } from '@/components/Routes/ProtectedRoute'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { StudyGuidanceGroups } from '@/components/StudyGuidanceGroups'
import { Teachers } from '@/components/Teachers'
import { Banners } from '@/pages/Banners'
import { Changelog } from '@/pages/Changelog'
import { CloseToGraduation } from '@/pages/CloseToGraduation'
import { CompletedCourses } from '@/pages/CompletedCoursesSearch'
import { CourseStatistics } from '@/pages/CourseStatistics'
import { Faculties } from '@/pages/Faculties'
import { Feedback } from '@/pages/Feedback'
import { FrontPage } from '@/pages/FrontPage'
import { Students } from '@/pages/Students'
import { StudentDetails } from '@/pages/Students/StudentDetails'
import { StudentSearch } from '@/pages/Students/StudentSearch'
import { StudyProgramme } from '@/pages/StudyProgramme'
import { University } from '@/pages/University'
import { Updater } from '@/pages/Updater'
import { Users } from '@/pages/Users'

export const Routes = () => (
  <main style={{ flex: 1 }}>
    <Suspense fallback={<SegmentDimmer isLoading />}>
      <RouterRoutes>
        {/* Public routes */}
        <Route element={<FrontPage />} path="/" />
        <Route element={<Changelog />} path="/changelog" />
        <Route element={<CompletedCourses />} path="/completedcoursessearch" />
        <Route element={<University />} path="/university" />
        <Route element={<Feedback />} path="/feedback" />

        <Route element={<ProtectedRoute requireUserHasRights requiredRoles={['fullSisuAccess']} />}>
          <Route element={<PopulationStatistics />} path="/populations" />
          <Route element={<StudyProgramme />} path="/study-programme/:studyProgrammeId?" />
          <Route element={<CoursePopulation />} path="/coursepopulation" />
        </Route>

        <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
          <Route element={<Banners />} path="/banners" />
          <Route element={<Updater />} path="/updater" />
          <Route element={<Users />} path="/users/:userid?" />
        </Route>

        <Route element={<ProtectedRoute requireUserHasRights requiredRoles={['fullSisuAccess', 'courseStatistics']} />}>
          <Route element={<CourseStatistics />} path="/coursestatistics" />
        </Route>

        <Route element={<ProtectedRoute requiredRoles={['fullSisuAccess', 'facultyStatistics']} />}>
          <Route element={<Faculties />} path="/faculties/:facultyId?" />
        </Route>

        <Route
          element={<ProtectedRoute requireUserHasRights requiredRoles={['fullSisuAccess', 'studyGuidanceGroups']} />}
        >
          <Route element={<Students />} path="/students">
            <Route element={<StudentSearch />} index />
            <Route element={<StudentDetails />} path=":studentNumber" />
          </Route>
          <Route element={<CustomPopulation />} path="/custompopulation" />
        </Route>

        <Route element={<ProtectedRoute requiredRoles={['teachers']} />}>
          <Route element={<Teachers />} path="/teachers/:teacherid?" />
        </Route>

        <Route element={<ProtectedRoute requiredRoles={['studyGuidanceGroups']} />}>
          <Route element={<StudyGuidanceGroups />} path="/studyguidancegroups/:groupid?" />
        </Route>

        <Route element={<ProtectedRoute requiredRoles={['fullSisuAccess', 'studyGuidanceGroups']} />}>
          <Route element={<CloseToGraduation />} path="/close-to-graduation" />
        </Route>

        {/* Access control inside ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route element={<LanguageCenterView />} path="/languagecenterview" />
        </Route>

        {/* Catch all route */}
        <Route element={<Navigate replace to="/" />} path="*" />
      </RouterRoutes>
    </Suspense>
  </main>
)
