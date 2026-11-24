import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'

import { filterInternalReleases } from '@/common'
import { Link } from '@/components/common/Link'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useTitle } from '@/hooks/title'
import { FeatureItem } from '@/pages/FrontPage/FeatureItem'
import { ReleaseItem } from '@/pages/FrontPage/ReleaseItem'
import { SectionTitle } from '@/pages/FrontPage/SectionTitle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetChangelogQuery } from '@/redux/changelog'
import { checkUserAccess, getFullStudyProgrammeRights } from '@/util/access'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

const contentTexts = {
  university: {
    fi:
      'Opintopistekertymät ja valmistumisajat tutkintotasottain.' +
      ' Mahdollisuus tarkastella lukujen jyvittymistä tiedekuntasolle.',
    en:
      'Progress of credits and graduation times for all degree levels.' +
      ' Possibility to examine how the numbers are distributed to faculty level.',
    sv:
      'Studiepoängsprogression och tid till examen per examensnivå.' +
      ' Det är möjligt att undersöka hur siffrorna fördelar sig på fakultetsnivå.',
  },
  faculties: {
    fi:
      'Opintopistekertymät, valmistumisajat ja yleiset tilastotiedot tutkintotasoittain.' +
      ' Mahdollisuus tarkastella lukujen jyvittymistä koulutusohjelmatasolle.',
    en:
      'Progress of credits, graduation times and basic statistics for all degree levels.' +
      ' Possibility to check how numbers are distributed to study programme level.',
    sv:
      'Studiepoängsprogression, tid till examen och grundläggande statistik per examensnivå.' +
      ' Det är möjligt att undersöka hur siffrorna fördelar sig på utbildningsprogramnivå.',
  },
  programmesClassStats: {
    fi: 'Valitun koulutusohjelmakohtaisen vuosikurssin tarkempi tarkastelu.',
    en: 'View details of a specific year of a degree programme.',
    sv: 'Se detaljer om utbildningsprogrammet för det valda året',
  },
  programmesOverview: {
    fi: 'Koulutusohjelman tilastot vuodesta 2017 alkaen.',
    en: 'Statistics of a programme starting from 2017.',
    sv: 'Statistik över utbildningsprogrammet från och med 2017.',
  },
  courses: {
    fi: 'Tarkastele hakemasi kurssin tai moduulin suoritus-, ilmoittautumis- ja arvosanatilastoja.',
    en: 'View completed credits, enrollment and grade statistics of the searched course or module.',
    sv: 'Se prestationer, anmälningar och vitsord för den sökta kursen eller modulen.',
  },
  coursesStudentLevel: {
    fi: 'Voit myös tarkastella kurssin tai moduulin opiskelijatason tilastoja.',
    en: 'View statistics on the student level for a course or a module.',
    sv: 'Se statistik på studentnivå för en kurs eller en module.',
  },
  sgg: {
    fi: 'Ohjaamiesi ryhmien opiskelijakohtaset tilastot.',
    en: 'Student statistics for your study guidance groups.',
    sv: 'Studentstatistik för din handledningsgrupp.',
  },
  students: {
    fi: 'Tarkastele opiskelijan opintosuorituksia ja opinto-oikeuksia.',
    en: 'View completed studies and study rights for a student.',
    sv: 'Se en students prestationer och studierätter.',
  },
  teacher: {
    fi: 'Opettajien tuottamat opintopisteet. Voit myös hakea koulutusohjelma- tai opettajakohtaisia tilastoja.',
    en: 'Credits produced by teachers. You can also search for degree programme or teacher specific statistics.',
    sv: 'Studiepoäng producerade av lärare. Du kan också söka efter statistik för specifika utbildningsprogram eller lärare.',
  },
  customPopsGeneric: {
    fi: 'Valitsemasi opiskelijapopulaation tilastot. Voit hakea populaation opiskelijanumeroilla tai koulutusohjelmakoodeilla.',
    en: 'Statistics for the selected student population. You can search for the population using student numbers or degree programme codes.',
    sv: 'Statistik för den studentpopulation du har valt. Du kan söka efter populationen med hjälp av studentnummer eller utbildningsprogramkoder.',
  },
  customPopsCourses: {
    fi: 'Tarkista valitsemasi opiskelijaryhmän tiedot liittyen valitsemiisi kursseihin.',
    en: 'Check the chosen stundents` information related to chosen courses.',
    sv: 'Kontrollera uppgifterna för den studentgrupp du har valt avseende de kurser du har valt.',
  },
  customPopsLanguage: {
    fi: 'Tarkastele kielikeskuksen kurssien tilastoja.',
    en: 'View language center`s course statistics.',
    sv: 'Se statistiken över språkcentrets kurser.',
  },
  customPopsCloseToGrad: {
    fi: 'Tarkastele lähellä valmistumista olevien opiskelijoiden tietoja.',
    en: 'View information related to students of close to graduation.',
    sv: 'Se uppgifterna om studerande som är nära att utexamineras.',
  },
  feedback: {
    fi: 'Kysyttävää tai palautetta Oodikoneesta? Lähetä meille viesti',
    en: 'For questions and suggestions, please use the',
    sv: 'Återkoppling om Oodikone? Skicka oss ett meddelande via',
  },
  feedbackForm: {
    fi: 'palautelomakeella',
    en: 'feedback form',
    sv: 'feedbackformuläret',
  },
  feedbackEmail: {
    fi: 'tai lähetä sähköpostia',
    en: 'or send email to',
    sv: 'eller per e-post',
  },
}

export const FrontPage = () => {
  'use memo'
  useTitle()

  const { data: releaseData, isLoading } = useGetChangelogQuery()
  const { roles, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const { language } = useLanguage()

  const featureItems = [
    {
      show: true,
      title: 'University',
      content: contentTexts.university[language],
    },
    {
      show: checkUserAccess(['admin', 'facultyStatistics'], roles),
      title: 'Faculties',
      content: contentTexts.faculties[language],
    },
    {
      show: checkUserAccess(['admin', 'fullSisuAccess'], roles) || programmeRights.length > 0,
      title: 'Programmes',
      content: (
        <ul style={{ margin: 2 }}>
          <li>
            <strong>Overview:</strong> {contentTexts.programmesOverview[language]}
          </li>
          <li>
            <strong>Class statistics:</strong> {contentTexts.programmesClassStats[language]}
          </li>
        </ul>
      ),
    },
    {
      show: checkUserAccess(['courseStatistics', 'admin'], roles) || fullStudyProgrammeRights.length > 0,
      title: 'Courses and modules',
      content:
        contentTexts.courses[language] +
        ` ${fullStudyProgrammeRights.length > 0 || checkUserAccess(['admin'], roles) ? contentTexts.coursesStudentLevel[language] : ''}`,
    },
    {
      show: checkUserAccess(['studyGuidanceGroups', 'admin'], roles) || fullStudyProgrammeRights.length > 0,
      title: 'Students',
      content: contentTexts.students[language],
    },
    {
      show: checkUserAccess(['admin', 'teachers'], roles),
      title: 'Teachers',
      content: contentTexts.teacher[language],
    },
    {
      show: checkUserAccess(['studyGuidanceGroups', 'admin'], roles),
      title: 'Guidance groups',
      content: contentTexts.sgg[language],
    },
    {
      show: checkUserAccess(['admin', 'courseStatistics', 'fullSisuAccess', 'studyGuidanceGroups'], roles),
      title: 'Special populations',
      content: (
        <ul style={{ margin: 2 }}>
          {checkUserAccess(['admin', 'fullSisuAccess'], roles) && (
            <li>
              <strong>Custom population:</strong> {contentTexts.customPopsGeneric[language]}
            </li>
          )}
          {checkUserAccess(['admin', 'courseStatistics', 'fullSisuAccess', 'studyGuidanceGroups'], roles) && (
            <li>
              <strong>Completed courses of student:</strong> {contentTexts.customPopsCourses[language]}
            </li>
          )}
          {checkUserAccess(['admin'], roles) && (
            <li>
              <strong>Language center:</strong> {contentTexts.customPopsLanguage[language]}
            </li>
          )}
          {checkUserAccess(['admin', 'fullSisuAccess', 'studyGuidanceGroups'], roles) && (
            <li>
              <strong>Student close to graduation:</strong> {contentTexts.customPopsCloseToGrad[language]}
            </li>
          )}
        </ul>
      ),
    },
    {
      show: true,
      title: 'Feedback',
      content: (
        <p>
          {contentTexts.feedback[language]}{' '}
          <a href="https://oodikone.helsinki.fi/feedback">{contentTexts.feedbackForm[language]}</a>{' '}
          {contentTexts.feedbackEmail[language]} <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
        </p>
      ),
    },
  ]

  const visibleReleases = releaseData?.filter(filterInternalReleases).slice(0, 2) ?? []

  return (
    <PageLayout maxWidth="lg">
      <PageTitle subtitle="Exploratory Research on Study Data" title="Oodikone" />
      <Stack direction={{ sm: 'column', md: 'row' }} divider={<Divider flexItem orientation="vertical" />} gap={3}>
        <Stack direction="column" gap={2} sx={{ width: { sm: '100%', md: '50%' } }}>
          <SectionTitle title="Features" />
          <Stack direction="column" divider={<Divider flexItem orientation="horizontal" />} gap={2}>
            {featureItems.map(
              item => item.show && <FeatureItem content={item.content} key={item.title} title={item.title} />
            )}
          </Stack>
        </Stack>
        <Stack direction="column" gap={2} sx={{ width: { sm: '100%', md: '50%' } }}>
          <SectionTitle title="Latest updates" />
          <Stack direction="column" divider={<Divider flexItem orientation="horizontal" />} gap={2}>
            {visibleReleases.map(release => (
              <ReleaseItem isLoading={isLoading} key={release.title} release={release} />
            ))}
          </Stack>
          <Box sx={{ justifyContent: 'center', display: 'flex' }}>
            <Button component={Link} to="/changelog" variant="contained">
              View more
            </Button>
          </Box>
        </Stack>
      </Stack>
    </PageLayout>
  )
}
