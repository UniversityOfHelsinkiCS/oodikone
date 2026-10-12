import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { orderBy } from 'lodash-es'
import { useMemo, useState } from 'react'

import { useCurriculum } from '@/hooks/useCurriculum'
import { CreditCriteriaSection } from '@/pages/StudyProgramme/DegreeCoursesTab/CreditCriteriaSection'
import { CurriculumSection } from '@/pages/StudyProgramme/DegreeCoursesTab/CurriculumSection'
import { DegreeCourseTable, DegreeModule } from '@/pages/StudyProgramme/DegreeCoursesTab/DegreeCourseTable'
import { ManageCoursesShownInfo } from '@/pages/StudyProgramme/DegreeCoursesTab/InfoBox'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { ProgrammeCourse } from '@oodikone/shared/types'
import { getCombinedProgramme } from '@oodikone/shared/util/studyProgramme'
import { Section } from '@/components/Section'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'

export type DegreeSettingsTab = 'criteria' | 'visibility'

const getModules = (courses: ProgrammeCourse[], programmeCode: string): DegreeModule[] => {
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
      programmeCode,
    })),
    module => module.code
  )
}

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
  degreeProgramme,
  initialTab = 'criteria',
}: {
  degreeProgramme: string
  initialTab?: DegreeSettingsTab
}) => {
  const [currentTab, setCurrentTab] = useState<DegreeSettingsTab>(initialTab)
  const { data: criteria } = useGetProgressCriteriaQuery({ programmeCode: degreeProgramme })
  const { data: programmes } = useGetProgrammesQuery()
  const { getTextIn } = useLanguage()
  const { curriculum, curriculumList, setSelectedCurriculum: setCurriculum } = useCurriculum()
  const secondProgramme = getCombinedProgramme(degreeProgramme)

  // A combined programme has courses from two curriculums. Show them in one table, first programme's modules first.
  const modules = useMemo(
    () =>
      curriculum
        ? [
            ...getModules(curriculum.defaultProgrammeCourses ?? [], degreeProgramme),
            ...(secondProgramme ? getModules(curriculum.secondProgrammeCourses ?? [], secondProgramme) : []),
          ]
        : [],
    [curriculum, degreeProgramme, secondProgramme]
  )

  const programmeNames = Object.fromEntries(
    [degreeProgramme, secondProgramme]
      .filter(code => code !== undefined)
      .map(code => {
        const programme = programmes?.allProgrammes?.[code] ?? programmes?.filteredProgrammes?.[code]
        return [code, programme ? getTextIn(programme.name)! : code]
      })
  )

  if (!curriculum || !criteria) return null

  const hasCriteria = isBachelorOrLicentiateProgramme(degreeProgramme)
  const renderCourseTable = (tab: DegreeSettingsTab) =>
    !!modules.length && (
      <Section infoBoxContent={getTextIn(sectionTexts[tab].toolTip) ?? ''} title={sectionTexts[tab].title}>
        <DegreeCourseTable
          criteria={criteria}
          curriculumVersion={curriculum.periodIds}
          modules={modules}
          programmeNames={programmeNames}
          showCriteria={tab === 'criteria'}
          showVisibility={tab === 'visibility'}
          studyProgramme={degreeProgramme}
        />
      </Section>
    )

  const curriculumSection = (
    <CurriculumSection curriculum={curriculum} curriculumList={curriculumList} setCurriculum={setCurriculum} />
  )

  const visibilityPanel = (
    <Stack gap={2}>
      {curriculumSection}
      {renderCourseTable('visibility')}
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
              {renderCourseTable('criteria')}
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
