import { DegreeCourseTable } from '@/pages/StudyProgramme/DegreeCoursesTab/DegreeCourseTable'
import { Module, ProgrammeCourse, ProgressCriteria } from '@oodikone/shared/types'
import { ReduxWrapper } from '../../ReduxWrapper'

const course = (code: string, name: string, visible = true) =>
  ({
    code,
    group_id: `group-${code}`,
    module_order: 0,
    name: { fi: name, en: name },
    parent_code: 'MOD1',
    parent_name: { fi: 'Basic studies', en: 'Basic studies' },
    visible: { id: null, visibility: visible },
  }) as unknown as ProgrammeCourse

const criteria: ProgressCriteria = {
  allCourseGroups: {},
  courses: {
    yearOne: ['group-MAT101'],
    yearTwo: [],
    yearThree: [],
    yearFour: [],
    yearFive: [],
    yearSix: [],
  },
  credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
}

/**
 * Mounts `DegreeCourseTable` with one module of two courses. MAT101 is required for year 1.
 * With `partlyHidden`, MAT102 is hidden.
 */
export const DegreeCourseTableWrapper = ({
  partlyHidden = false,
  showCriteria = true,
  showVisibility = true,
  studyProgramme = 'KH50_001',
}: {
  partlyHidden?: boolean
  showCriteria?: boolean
  showVisibility?: boolean
  studyProgramme?: string
}) => {
  const modules: Module[] = [
    {
      code: 'MOD1',
      courses: [course('MAT101', 'Calculus I'), course('MAT102', 'Linear algebra', !partlyHidden)],
      order: 0,
    },
  ]
  return (
    <ReduxWrapper
      component={
        <DegreeCourseTable
          combinedProgramme=""
          criteria={criteria}
          curriculumVersion={['period-1']}
          modules={modules}
          showCriteria={showCriteria}
          showVisibility={showVisibility}
          studyProgramme={studyProgramme}
        />
      }
    />
  )
}
