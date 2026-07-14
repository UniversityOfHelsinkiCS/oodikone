import { ColorizedCoursesTable } from '@/components/ColorizedCoursesTable'
import { useTitle } from '@/hooks/title'
import { useGetLanguageCenterDataQuery } from '@/redux/languageCenterView'
import { PageLayout } from '../common/PageLayout'
import { PageTitle } from '../common/PageTitle'

export const LanguageCenterView = () => {
  useTitle('Language center view')

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Language center statistics" />
      <ColorizedCoursesTable
        fetchDataHook={useGetLanguageCenterDataQuery}
        fetchDataHookParams={undefined}
        mode="languagecenterview"
        panes={['Faculties', 'Semesters']}
      />
    </PageLayout>
  )
}
