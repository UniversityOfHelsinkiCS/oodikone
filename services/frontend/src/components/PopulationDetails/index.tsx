import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { PanelView } from '@/components/common/PanelView'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import {
  hopsFilter as studyPlanFilter,
  hopsFilter,
  transferredToProgrammeFilter,
} from '@/components/FilterView/filters'
import { useFilters } from '@/components/FilterView/useFilters'
import { InfoBox } from '@/components/InfoBox'
import { PopulationStudents } from '@/components/PopulationStudents'
import { useCurriculumState } from '@/hooks/useCurriculums'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgressCriteriaQuery } from '@/redux/progressCriteria'
import { PopulationQuery } from '@/types/populationSearch'
import { getFullStudyProgrammeRights } from '@/util/access'

import { PopulationQueryCard } from '../PopulationSearch/PopulationQueryCard'
import { AdvancedSettings } from './AdvancedSettings'
import { AgeStats } from './AgeStats'
import { CourseTableModeSelector } from './CourseTableModeSelector'
import { CreditGainStats } from './CreditGainStats'
import { PopulationCourses } from './PopulationCourses'

type PopulationDetailsProps = {
  isLoading: boolean
  query: PopulationQuery
  populationTags: Map<string, string>
  filteredStudents: any[]
  filteredCourses: any[]
}

export const PopulationDetails = ({
  isLoading,
  query,
  populationTags,
  filteredStudents,
  filteredCourses,
}: PopulationDetailsProps) => {
  const { filterDispatch, useFilterSelector } = useFilters()

  const { programme, combinedProgramme, showBachelorAndMaster } = query

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  const primaryHopsCreditFilter = useFilterSelector(hopsFilter.selectors.isPrimarySelected())
  const combinedHopsCreditFilter = useFilterSelector(hopsFilter.selectors.isCombinedSelected(combinedProgramme))
  const bothHopsCreditFilter = useFilterSelector(hopsFilter.selectors.isBothSelected(combinedProgramme))
  const transferredSelected = useFilterSelector(transferredToProgrammeFilter.selectors.getState())

  const { isFetching: authLoading, programmeRights, fullAccessToStudentData } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const [studentAmountLimit, setStudentAmountLimit] = useState(0)
  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(programme, query?.years?.[0])

  useEffect(() => setStudentAmountLimit(Math.floor(filteredStudents.length * 0.3)), [filteredStudents.length])

  const { data: criteria } = useGetProgressCriteriaQuery({ programmeCode: programme }, { skip: !programme })
  const [courseTableMode, setCourseTableMode] = useState('curriculum')
  const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive())

  const onStudentAmountLimitChange = value => {
    if (!Number.isNaN(Number(value))) setStudentAmountLimit(+value)
  }

  if (isLoading || authLoading) return null

  const onlyIamRights =
    !fullAccessToStudentData &&
    !fullStudyProgrammeRights.includes(programme) &&
    !fullStudyProgrammeRights.includes(combinedProgramme ?? '')

  const panels = [
    {
      title: `Credit accumulation (for ${filteredStudents.length} students)`,
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.creditAccumulation} />
          {/* @ts-expect-error leave for later :) TODO */}
          <CreditAccumulationGraphHighCharts
            programmeCodes={[programme, combinedProgramme].filter(Boolean)}
            showBachelorAndMaster={!!showBachelorAndMaster}
            students={filteredStudents}
            studyPlanFilterIsActive={studyPlanFilterIsActive}
          />
        </div>
      ),
    },
    {
      title: 'Credit statistics',
      content:
        query.years.length > 1 ? (
          <div>This table is omitted when searching population of multiple years</div>
        ) : (
          <CreditGainStats filteredStudents={filteredStudents} query={query} year={query.years[0]} />
        ),
    },
    {
      title: 'Age distribution',
      content: <AgeStats filteredStudents={filteredStudents} query={query} />,
    },
    {
      title: 'Courses of class',
      content: (
        <div>
          <CourseTableModeSelector
            courseTableMode={courseTableMode}
            curriculum={curriculum}
            curriculumList={curriculumList}
            onStudentAmountLimitChange={onStudentAmountLimitChange}
            setCourseTableMode={setCourseTableMode}
            setCurriculum={setCurriculum}
            studentAmountLimit={studentAmountLimit}
          />
          <PopulationCourses
            courseTableMode={courseTableMode}
            curriculum={curriculum}
            filteredCourses={filteredCourses}
            isPending={isLoading}
            onlyIamRights={onlyIamRights}
            query={query}
            studentAmountLimit={studentAmountLimit}
          />
        </div>
      ),
    },
    !onlyIamRights
      ? {
          title: `Students (${filteredStudents.length})`,
          content: (
            <div>
              {/* @ts-expect-error leave for later :) TODO */}
              <PopulationStudents
                combinedProgramme={combinedProgramme}
                criteria={criteria}
                curriculum={curriculum}
                filteredCourses={filteredCourses}
                filteredStudents={filteredStudents}
                programme={programme}
                showBachelorAndMaster={showBachelorAndMaster}
                variant="population"
              />
            </div>
          ),
        }
      : null,
  ]

  return (
    <Box sx={{ mx: 2 }}>
      <Paper sx={{ p: 2, my: 2 }} variant="outlined">
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <FormGroup sx={{ gap: 1 }}>
            <Link style={{ width: 'fit-content' }} to="/populations">
              <Button startIcon={<KeyboardBackspaceIcon />} sx={{ mb: '10px' }} variant="contained">
                Search for a new class
              </Button>
            </Link>
            <FormControlLabel
              control={
                <Switch
                  checked={!!primaryHopsCreditFilter || !!bothHopsCreditFilter}
                  onChange={() => filterDispatch(hopsFilter.actions.toggle(undefined))}
                />
              }
              label={
                combinedProgramme
                  ? 'Show only credits included in bachelor study plan'
                  : 'Show only credits included in study plan'
              }
              sx={{ width: 'fit-content' }}
            />
            {combinedProgramme && (
              <FormControlLabel
                control={
                  <Switch
                    checked={!!combinedHopsCreditFilter || !!bothHopsCreditFilter}
                    onChange={() => filterDispatch(hopsFilter.actions.toggleCombinedProgramme(combinedProgramme))}
                  />
                }
                label="Show only credits included in licentiate study plan"
                sx={{ width: 'fit-content' }}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={transferredSelected !== false}
                  onChange={() => filterDispatch(transferredToProgrammeFilter.actions.toggle(undefined))}
                />
              }
              label="Show students who have transferred to the programme"
            />
            {query.years.length === 1 && (
              <FormControlLabel
                control={
                  <Switch
                    checked={showAdvancedSettings}
                    data-cy="advanced-toggle"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  />
                }
                label="View advanced settings"
              />
            )}
          </FormGroup>
          <PopulationQueryCard populationTags={populationTags} query={query} />
        </Stack>
        {showAdvancedSettings && <AdvancedSettings cleanUp={() => setShowAdvancedSettings(false)} query={query} />}
      </Paper>
      <PanelView panels={panels} />
    </Box>
  )
}
