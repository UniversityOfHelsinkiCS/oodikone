import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import { ColorizedCoursesTable } from '@/components/ColorizedCoursesTable'
import { useTitle } from '@/hooks/title'
import { useGetLanguageCenterDataQuery } from '@/redux/languageCenterView'

export const LanguageCenterView = () => {
  useTitle('Language center view')

  return (
    <>
      <Divider sx={{ width: '100%', mt: 3, mb: 1 }}>
        <Typography fontSize="1.3rem" variant="overline">
          Language center statistics
        </Typography>
      </Divider>
      <ColorizedCoursesTable
        fetchDataHook={useGetLanguageCenterDataQuery}
        fetchDataHookParams={undefined}
        mode="languagecenterview"
        panes={['Faculties', 'Semesters']}
      />
    </>
  )
}
