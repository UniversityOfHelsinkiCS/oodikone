import { DegreeCourseTable, DegreeModule } from '@/pages/StudyProgramme/DegreeCoursesTab/DegreeCourseTable'
import { ProgrammeCourse, ProgressCriteria } from '@oodikone/shared/types'
import { ReduxWrapper } from '../../ReduxWrapper'

const course = (code: string, name: string, visible = true, moduleName = 'Basic studies') =>
  ({
    code,
    group_id: `group-${code}`,
    module_order: 0,
    name: { fi: name, en: name },
    parent_code: 'MOD1',
    parent_name: { fi: moduleName, en: moduleName },
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
 * With `combined`, a second programme (MH90_001) adds a module with the same code that also contains MAT101.
 */
export const DegreeCourseTableWrapper = ({
  combined = false,
  partlyHidden = false,
  showCriteria = true,
  showVisibility = true,
  studyProgramme = 'KH50_001',
}: {
  combined?: boolean
  partlyHidden?: boolean
  showCriteria?: boolean
  showVisibility?: boolean
  studyProgramme?: string
}) => {
  const modules: DegreeModule[] = [
    {
      code: 'MOD1',
      courses: [course('MAT101', 'Calculus I'), course('MAT102', 'Linear algebra', !partlyHidden)],
      order: 0,
      programmeCode: studyProgramme,
    },
  ]
  if (combined) {
    modules.push({
      code: 'MOD1',
      courses: [course('MAT101', 'Calculus I', true, 'Clinical studies')],
      order: 0,
      programmeCode: 'MH90_001',
    })
  }
  return (
    <ReduxWrapper
      component={
        <DegreeCourseTable
          criteria={criteria}
          curriculumVersion={['period-1']}
          modules={modules}
          programmeNames={{ [studyProgramme]: 'First programme', MH90_001: 'Second programme' }}
          showCriteria={showCriteria}
          showVisibility={showVisibility}
          studyProgramme={studyProgramme}
        />
      }
    />
  )
}
