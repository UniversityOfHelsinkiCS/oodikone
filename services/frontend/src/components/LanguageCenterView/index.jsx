import { ColorizedCoursesTable } from '@/components/ColorizedCoursesTable'
import { useGetLanguageCenterDataQuery } from '@/redux/languageCenterView'

export const LanguageCenterView = () => (
  <ColorizedCoursesTable
    dividerText="Language center statistics"
    fetchDataHook={useGetLanguageCenterDataQuery}
    panes={['Faculties', 'Semesters']}
    title="Language center view"
  />
)
