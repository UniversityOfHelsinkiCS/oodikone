import { CurriculumProvider } from '@/hooks/useCurriculum'
import { DegreeCoursesTab, DegreeSettingsTab } from '@/pages/StudyProgramme/DegreeCoursesTab'
import { ReduxWrapper } from '../../ReduxWrapper'

/**
 * Mounts `DegreeCoursesTab` with a curriculum provider. Mock the curriculum and criteria APIs before mounting.
 */
export const DegreeCoursesTabWrapper = ({
  initialTab,
  programme,
}: {
  initialTab?: DegreeSettingsTab
  programme: string
}) => (
  <ReduxWrapper
    component={
      <CurriculumProvider programmeCode={programme} year={2024}>
        <DegreeCoursesTab combinedProgramme="" degreeProgramme={programme} initialTab={initialTab} />
      </CurriculumProvider>
    }
  />
)
