/* eslint-disable react/jsx-no-useless-fragment */
// ^ the fragments are in fact not useless

import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { PercentileGraph } from '@/components/Charts/Percentiles'
import { EnrollmentDateSelector } from '@/components/PopulationSearch/EnrollmentDateSelector'
import { StudyTrackStats } from '@oodikone/shared/types'
import { Section } from '@/components/Section'
import { StyledMessage } from '@/components/common/StyledMessage'
import { type Goals } from '@oodikone/shared/types/studyProgramme'

const NoData = ({ yearRange, studyTrack }) => (
  <StyledMessage sx={{ p: 1, my: 2, width: 'fit-content', alignSelf: 'center' }}>
    No data for class of {yearRange}{studyTrack ? ` (study track ${studyTrack})` : ''}.
  </StyledMessage>)

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

export const StudentProgressPercentiles = ({ data, studyTrack, graduationTimeGoals, doCombo, isCombinedProgramme }: Props) => {
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
    credits: [
      (graduationTimeGoals.combo - graduationTimeGoals.basic) * 30,
      graduationTimeGoals.combo * 30,
    ]
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ pb: 2, justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6">
          View class of
        </Typography>
        <EnrollmentDateSelector setYear={setChosenYear} year={chosenYear} slim />
      </Stack>

      {doCombo && (
        <>
          {studyTrack ? (
            <>
              {hasData(data.comboByTrack?.[studyTrack][chosenYear]) && (
                <Section>
                  <PercentileGraph
                    title={`Bachelor + master study right (${studyTrack}), class of ${yearRange}`}
                    data={data.comboByTrack[studyTrack][chosenYear]}
                    goalLines={goalLinesCombo}
                  />
                </Section>
              )}
            </>
          ) : (
            <>
              {hasData(data.combo?.[chosenYear]) && (
                <Section>
                  <PercentileGraph
                    title={`Bachelor + master study right, class of ${yearRange}`}
                    data={data.combo?.[chosenYear]}
                    goalLines={goalLinesCombo}
                  />
                </Section>
              )}
            </>
          )}
        </>
      )}

      {studyTrack ? (
        <>
          {hasData(data.byTrack?.[studyTrack][chosenYear]) ? (
            <Section>
              <PercentileGraph
                title={`${doCombo ? 'Master' : 'Bachelor'} study right (${studyTrack}), class of ${yearRange}`}
                data={data.byTrack[studyTrack][chosenYear]}
                goalLines={goalLinesBasic}
              />
            </Section>
          ) : (
            <NoData yearRange={yearRange} studyTrack={studyTrack} />
          )}
        </>
      ) : (
        <>
          {hasData(data.main[chosenYear]) ? (
            <Section>
              <PercentileGraph
                data={data.main[chosenYear]}
                title={`${doCombo ? 'Master' : 'Bachelor'} study right, class of ${yearRange}`}
                goalLines={isCombinedProgramme ? goalLinesCombo : goalLinesBasic}
              />
            </Section>
          ) : (
            <NoData yearRange={yearRange} studyTrack={studyTrack} />
          )}
        </>
      )}
    </Stack>
  )
}
