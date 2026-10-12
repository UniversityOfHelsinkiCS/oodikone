import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { orderBy } from 'lodash-es'
import { useEffect, useState } from 'react'

import { useCurriculum } from '@/hooks/useCurriculum'
import { CreditCriteriaSection } from '@/pages/StudyProgramme/DegreeCoursesTab/CreditCriteriaSection'
import { CurriculumSection } from '@/pages/StudyProgramme/DegreeCoursesTab/CurriculumSection'
import { DegreeCourseTable } from '@/pages/StudyProgramme/DegreeCoursesTab/DegreeCourseTable'
import { ManageCoursesShownInfo } from '@/pages/StudyProgramme/DegreeCoursesTab/InfoBox'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { Module, ProgrammeCourse } from '@oodikone/shared/types'
import { Section } from '@/components/Section'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'

export type DegreeSettingsTab = 'criteria' | 'visibility'

const sectionTexts = {
  criteria: {
    title: 'Course completion academic year targets',
    toolTip: studyProgrammeToolTips.degreeCoursesTab.requiredCourses,
  },
  visibility: {
    title: 'Alter course and module visibility',
    toolTip: studyProgrammeToolTips.degreeCoursesTab.courseVisibility,
  },
}

export const DegreeCoursesTab = ({
  combinedProgramme,
  degreeProgramme,
  initialTab = 'criteria',
}: {
  combinedProgramme: string
  degreeProgramme: string
  initialTab?: DegreeSettingsTab
}) => {
  const [currentTab, setCurrentTab] = useState<DegreeSettingsTab>(initialTab)
  const [defaultProgrammeModules, setDefaultProgrammeModules] = useState<Module[]>([])
  const [secondProgrammeModules, setSecondProgrammeModules] = useState<Module[]>([])
  const { data: criteria } = useGetProgressCriteriaQuery({ programmeCode: degreeProgramme })
  const { getTextIn } = useLanguage()
  const { curriculum, curriculumList, setSelectedCurriculum: setCurriculum } = useCurriculum()

  const getModules = (courses: ProgrammeCourse[]): Module[] => {
    const modules: Record<string, ProgrammeCourse[]> = {}
    courses.forEach(course => {
      const code = course.parent_code!
      modules[code] ??= []
      modules[code].push(course)
    })

    return orderBy(
      Object.entries(modules).map(([code, courses]) => ({
        code,
        courses,
        order: courses[0].module_order,
      })),
      module => module.code
    )
  }

  useEffect(() => {
    if (!curriculum?.defaultProgrammeCourses?.length) {
      return
    }

    setDefaultProgrammeModules(getModules(curriculum.defaultProgrammeCourses))
    if (combinedProgramme) {
      setSecondProgrammeModules(getModules(curriculum.secondProgrammeCourses))
    }
  }, [combinedProgramme, curriculum])

  if (!curriculum || !criteria) return null

  const hasCriteria = isBachelorOrLicentiateProgramme(degreeProgramme)
  const hasModules = !!defaultProgrammeModules.length || !!secondProgrammeModules.length

  const renderCourseTables = (tab: DegreeSettingsTab) =>
    hasModules && (
      <Section infoBoxContent={getTextIn(sectionTexts[tab].toolTip) ?? ''} title={sectionTexts[tab].title}>
        <Stack gap={2}>
          {!!defaultProgrammeModules.length && (
            <DegreeCourseTable
              combinedProgramme=""
              criteria={criteria}
              curriculumVersion={curriculum.periodIds}
              modules={defaultProgrammeModules}
              showCriteria={tab === 'criteria'}
              showVisibility={tab === 'visibility'}
              studyProgramme={degreeProgramme}
            />
          )}
          {!!secondProgrammeModules.length && (
            <DegreeCourseTable
              combinedProgramme={combinedProgramme}
              criteria={criteria}
              curriculumVersion={curriculum.periodIds}
              modules={secondProgrammeModules}
              showCriteria={tab === 'criteria'}
              showVisibility={tab === 'visibility'}
              studyProgramme={degreeProgramme}
            />
          )}
        </Stack>
      </Section>
    )

  const curriculumSection = (
    <CurriculumSection curriculum={curriculum} curriculumList={curriculumList} setCurriculum={setCurriculum} />
  )

  const visibilityPanel = (
    <Stack gap={2}>
      {curriculumSection}
      {renderCourseTables('visibility')}
    </Stack>
  )

  return (
    <Stack gap={2}>
      <ManageCoursesShownInfo />
      {hasCriteria ? (
        <>
          <Tabs
            data-cy="degree-settings-tabs"
            onChange={(_event, newTab: DegreeSettingsTab) => setCurrentTab(newTab)}
            value={currentTab}
          >
            <Tab data-cy="criteria-tab" label="Progress tab criteria" value="criteria" />
            <Tab data-cy="visibility-tab" label="Course & module visibility" value="visibility" />
          </Tabs>
          {/* Both panels stay mounted so unsaved table state (visibility, expanded modules) survives tab switches */}
          <Box data-cy="criteria-panel" hidden={currentTab !== 'criteria'}>
            <Stack gap={2}>
              {curriculumSection}
              <CreditCriteriaSection criteria={criteria} degreeProgramme={degreeProgramme} />
              {renderCourseTables('criteria')}
            </Stack>
          </Box>
          <Box data-cy="visibility-panel" hidden={currentTab !== 'visibility'}>
            {visibilityPanel}
          </Box>
        </>
      ) : (
        <Box data-cy="visibility-panel">{visibilityPanel}</Box>
      )}
    </Stack>
  )
}
