/* eslint-disable react/jsx-no-useless-fragment */
// ^ the fragments are in fact not useless

import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { PercentileGraph } from '@/components/Charts/Percentiles'
import { StyledMessage } from '@/components/common/StyledMessage'
import { EnrollmentDateSelector } from '@/components/PopulationSearch/EnrollmentDateSelector'
import { Section } from '@/components/Section'
import { StudyTrackStats } from '@oodikone/shared/types'
import { type Goals } from '@oodikone/shared/types/studyProgramme'

const NoData = ({ yearRange, studyTrack }) => (
  <StyledMessage sx={{ p: 1, my: 2, width: 'fit-content', alignSelf: 'center' }}>
    No data for class of {yearRange}
    {studyTrack ? ` (study track ${studyTrack})` : ''}.
  </StyledMessage>
)

const hasData = (data: Record<string, [string, number][]> | undefined): data is Record<string, [string, number][]> => {
  if (!data) return false
  return !Object.values(data).every(percentiles => percentiles.every(value => value.at(1) === null))
}

type Props = {
  data: StudyTrackStats['percentiles']
  doCombo: boolean
  isCombinedProgramme: boolean
  graduationTimeGoals: Goals
  studyTrack: undefined | string
}

export const StudentProgressPercentiles = ({
  data,
  studyTrack,
  graduationTimeGoals,
  doCombo,
  isCombinedProgramme,
}: Props) => {
  const [chosenYear, setChosenYear] = useState(new Date().getFullYear() - 4) // Magic number: a placeholder

  const yearRange = `${chosenYear} - ${chosenYear + 1}`

  const goalLinesBasic = {
    dates: [`${chosenYear + graduationTimeGoals.basic / 2}-07-31`],
    credits: [graduationTimeGoals.basic * 30],
  }

  const goalLinesCombo = {
    dates: [
      `${chosenYear + (graduationTimeGoals.combo - graduationTimeGoals.basic) / 2}-07-31`,
      `${chosenYear + graduationTimeGoals.combo / 2}-07-31`,
    ],
    credits: [(graduationTimeGoals.combo - graduationTimeGoals.basic) * 30, graduationTimeGoals.combo * 30],
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ pb: 2, justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6">View class of</Typography>
        <EnrollmentDateSelector setYear={setChosenYear} slim year={chosenYear} />
      </Stack>

      {doCombo ? (
        <>
          {studyTrack ? (
            <>
              {hasData(data.comboByTrack?.[studyTrack][chosenYear]) && (
                <Section>
                  <PercentileGraph
                    data={data.comboByTrack[studyTrack][chosenYear]}
                    goalLines={goalLinesCombo}
                    title={`Bachelor + master study right (${studyTrack}), class of ${yearRange}`}
                  />
                </Section>
              )}
            </>
          ) : (
            <>
              {hasData(data.combo?.[chosenYear]) && (
                <Section>
                  <PercentileGraph
                    data={data.combo?.[chosenYear]}
                    goalLines={goalLinesCombo}
                    title={`Bachelor + master study right, class of ${yearRange}`}
                  />
                </Section>
              )}
            </>
          )}
        </>
      ) : null}

      {studyTrack ? (
        <>
          {hasData(data.byTrack?.[studyTrack][chosenYear]) ? (
            <Section>
              <PercentileGraph
                data={data.byTrack[studyTrack][chosenYear]}
                goalLines={goalLinesBasic}
                title={`${doCombo ? 'Master' : 'Bachelor'} study right (${studyTrack}), class of ${yearRange}`}
              />
            </Section>
          ) : (
            <NoData studyTrack={studyTrack} yearRange={yearRange} />
          )}
        </>
      ) : (
        <>
          {hasData(data.main[chosenYear]) ? (
            <Section>
              <PercentileGraph
                data={data.main[chosenYear]}
                goalLines={isCombinedProgramme ? goalLinesCombo : goalLinesBasic}
                title={`${doCombo ? 'Master' : 'Bachelor'} study right, class of ${yearRange}`}
              />
            </Section>
          ) : (
            <NoData studyTrack={studyTrack} yearRange={yearRange} />
          )}
        </>
      )}
    </Stack>
  )
}
