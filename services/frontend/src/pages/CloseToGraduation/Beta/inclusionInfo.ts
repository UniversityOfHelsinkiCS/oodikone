import type { CloseToGraduationTab } from '@/pages/CloseToGraduation/Beta/tabs'

const creditLimitsByTab: Record<CloseToGraduationTab, { programme: string; credits: number }[]> = {
  bachelor: [{ programme: 'All bachelor’s programmes', credits: 140 }],
  masterAndLicentiate: [
    { programme: 'Degree Programme in Veterinary Medicine', credits: 150 },
    { programme: 'Degree Programme in Medicine', credits: 330 },
    { programme: 'Degree Programme in Dentistry', credits: 300 },
    { programme: 'Master’s Programme in Psychology', credits: 115 },
    { programme: 'Other master’s programmes', credits: 70 },
  ],
}

export const getInclusionInfoContent = (tab: CloseToGraduationTab) =>
  [
    'Students are included based on the number of credits they have completed in their primary study plan.',
    '',
    ...creditLimitsByTab[tab].map(({ programme, credits }) => `- ${programme}: at least ${credits} credits`),
    '',
    'If you have access to all student data in Oodikone, you can see all students here. Otherwise you will only see the students in your study guidance groups.',
    '',
    'The list can be narrowed down using the provided filters. Please note that selecting a faculty limits the programmes to those of the faculty.',
  ].join('\n')
