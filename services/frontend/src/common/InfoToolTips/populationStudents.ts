export const populationStudentsToolTips = {
  generalTab: {
    associatedProgramme:
      'Programme associated with the attainment or enrollment. View **programme distribution** above for more details.',
    primaryProgramme:
      'Programme associated with the most recently acquired active study right. Columns showing degree programme specific data (e.g. Started in programme or Credits in HOPS) refer to the programme displayed here.',
    programmeStatus:
      'Shows the status of the studyright associated with the corresponding programme. Status is active only if an active semester enrollment for the ongoing semester exists.',
    beforeStarting: `
Credits and courses that
1. were attained before starting in the current programme
2. were either completed or transferred
3. are included in the primary study plan for the programme
`,
    startDates: `
**University**: First degree-leading study right granted in the University
**Study right\\***: Study right associated with current programme
**Programme\\***: Start date in the current programme

\\* if applicable`,
    studyTimeMonths: `
Time passed since starting in the programme until graduation, excluding allowed absences (unlimited statutory and 2 non-statutory absences). Each unique calendar month increments the amount.

**Example:**  
from 31st of January to 1st of March = 3 months
from 1st of January to 30th of March = 3 months`,
    programmes:
      'If a student has more than one programme, hover your mouse on the cell to view the rest. They are also displayed in the exported Excel file.',
    mostRecentAttainment: 'Date of the most recent course completion that is included in the HOPS',
    tvex: 'Student is enrolled to a bilingual programme (kaksikielinen tutkinto, tvåspråkig examen)',
  },
}
