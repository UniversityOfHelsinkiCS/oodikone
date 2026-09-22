import { PopulationStudents } from '@/components/PopulationComponents/Students'
import { ReduxWrapper } from '../../../ReduxWrapper'

// Partial<FormattedStudent>[]
const students = [{ studentNumber: '010000001' }] as any

const columnFunction = (): [string[], string[]] => [['studentNumber'], []]

const formattingFunction = () => [{ studentNumber: '010000001' }]

/**
 * Mounts `PopulationStudents` in the `population` variant.
 *
 * The selected years are read from the query params, so navigate the page to eg. `/?years=2020` before mounting.
 */
export const PopulationStudentsWrapper = ({ programme }: { programme: string }) => (
  <ReduxWrapper
    component={
      <PopulationStudents
        curriculum={null}
        filteredCourses={[]}
        filteredStudents={students}
        generalTabColumnFunction={columnFunction}
        generalTabFormattingFunction={formattingFunction}
        idToGroupIdMap={{}}
        programme={programme}
        variant="population"
      />
    }
  />
)
