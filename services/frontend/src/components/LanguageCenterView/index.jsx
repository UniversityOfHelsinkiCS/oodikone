import React from 'react'

import { ColorizedCoursesTable } from '@/components/ColorizedCoursesTable'
import { useGetLanguageCenterDataQuery } from '@/redux/languageCenterView'
import { InfoBox } from './InfoBox'

export const LanguageCenterView = () => (
  <ColorizedCoursesTable
    dividerText="Language center statistics"
    fetchDataHook={useGetLanguageCenterDataQuery}
    infoBox={<InfoBox />}
    panes={['Faculties', 'Semesters']}
    title="Language center view"
  />
)
