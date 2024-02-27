import React from 'react'

import { ColorizedCoursesTable } from '@/components/ColorizedCoursesTable'
import { useGetLanguageCenterDataQuery } from '@/redux/languageCenterView'
import { InfoBox } from './InfoBox'

export const LanguageCenterView = () => (
  <ColorizedCoursesTable
    fetchDataHook={useGetLanguageCenterDataQuery}
    title="Language center view"
    panes={['Faculties', 'Semesters']}
    infoBox={<InfoBox />}
    dividerText="Language center statistics"
  />
)
