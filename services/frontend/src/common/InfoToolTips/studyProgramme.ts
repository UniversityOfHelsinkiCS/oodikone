export const studyProgrammeToolTips = {
  common: {
    yearToggle: `
**Calendar year**: Näyttää tilastot kalenterivuosille jaoteltuna (esim. 1.1.–31.12.2024)  
**Academic year**: Näyttää tilastot lukuvuosille jaoteltuna (esim. 1.8.2023–31.7.2024)
`,
    studyRightToggle: `
**All study rights**: Valinnassa ovat mukana vaihto-opiskelijat, erillisoikeudella opiskelevat ja ohjelmaan siirtyneet opiskelijat sekä ohjelmasta pois siirtyneet opiskelijat.  
**Special study rights excluded**: Valinnasta ja kaikista luvuista on poissuljettu kaikki edellä mainitut erikoisryhmät.
`,
    graduatedToggle: `
**Graduated included**: Valinnassa ovat mukana ohjelmasta jo valmistuneet opiskelijat.  
**Graduated excluded**: Valinnasta on poistettu ohjelmasta jo valmistuneet opiskelijat.
`,
    studentsOfTheStudyProgramme: `
**Started studying**: Sisältää opiskelijat, jotka ovat kyseisenä vuonna ilmoittautuneet ensimmäistä kertaa läsnäolevaksi koulutusohjelmassa. Opiskelija on voinut myös myöhemmin keskeyttää opintonsa tai siirtyä pois ohjelmasta.

**Accepted**: Sisältää opiskelijat, joiden opiskeluoikeus koulutusohjelmassa on alkanut kyseisenä vuonna. Opiskelija on saattanut ilmoittautua poissaolevaksi tai jättää lukuvuosi-ilmoittautumisen kokonaan tekemättä.

**Graduated**: Sisältää kyseisenä vuonna valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty.

**Transferred away**: Sisältää kyseisenä vuonna pois ohjelmasta siirtyneet opiskelijat (opiskeluoikeudet). Sama opiskelija voi esiintyä tilastoissa useana vuonna, mikäli hän on siirtynyt ohjelmaan ja siitä pois useasti.

**Transferred to**: Sisältää kyseisenä vuonna ohjelmaan siirtyneet opiskelijat (opiskeluoikeudet). Ohjelmaan siirtyneiden määrä on erityisen suuri vuonna 2020, jolloin opiskelijat siirtyivät vanhoista koulutusohjelmista uusiin ohjelmiin.
`,
    averageGraduationTimes: `
Yksittäinen palkki kertoo, kuinka moni opiskelija on valmistunut kyseisenä vuonna/lukuvuonna.

Vihreä **vaakapalkki** kuvaa tavoiteajassa valmistuneita, keltainen kahden lukukauden sisällä tavoiteajasta valmistuneita ja punainen yli 2 lukukautta tavoiteajan ylittäneitä.

**Breakdown**: Näyttää, kuinka moni kyseisenä kalenteri- tai lukuvuotena valmistuneista opiskelijoista valmistui tavoiteajassa, kahden lukukauden sisällä tavoiteajasta tai tätä myöhemmin.

**Median time**: Näyttää kyseisenä kalenteri- tai lukuvuotena valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina. Vihreä **katkoviiva** kuvastaa tavoiteaikaa. Keltainen katkoviiva on tavoiteaika + 2 lukukautta.

Valmistumisajoista on vähennetty lakisääteiset poissaolot.
`,
    studyTrackOverview: `
- **All**: Opiskelijat, joiden opiskeluoikeus on alkanut kyseisenä lukuvuonna. Opiskelijoiden, joiden opiskeluoikeuteen kuuluu sekä kandidaatin että maisterin tutkinnon suoritusoikeus, aloituspäivä maisteriohjelmassa on kandidaatin tutkinnon valmistumispäivän jälkeinen päivä.
- **Started studying**: Opiskelijat, jotka ovat ilmoittautuneet läsnäolevaksi samana lukuvuonna kuin heidän opiskeluoikeutensa on alkanut. Opiskelija on voinut myöhemmin keskeyttää opintonsa tai siirtyä pois ohjelmasta.

**Current status** kuvastaa opiskelijoiden tilannetta tällä hetkellä.
- **Present**: Käynnissä olevalle lukukaudelle **läsnäolevaksi** ilmoittautuneet opiskelijat, jotka eivät ole valmistuneet koulutusohjelmasta
- **Absent**: Käynnissä olevalle lukukaudelle **poissaolevaksi** ilmoittautuneet opiskelijat, jotka eivät ole valmistuneet koulutusohjelmasta
- **Passive**: Opiskelijat, jotka eivät ole valmistuneet koulutusohjelmasta eivätkä ilmoittautuneet läsnä- tai poissaolevaksi käynnissä olevalle lukukaudelle
- **Graduated**: Koulutusohjelmasta valmistuneet opiskelijat
- **Has recent attainment**: Opiskelijat, jotka ovat kuluneen vuoden (365vrk) aikana suorittaneet ensisijaiseen opintosuunnitelmaansa sisällytettyjä opintoja

Lukukausi-ilmoittautumisissa huomioidaan vain se opiskeluoikeus, joka liittyy tarkasteltavaan koulutusohjelmaan. Vaikka opiskelija olisi ilmoittautunut toiseen opiskeluoikeuteen läsnäolevaksi, mutta hän on laiminlyönyt ilmoittautumisen tarkasteltavaan koulutusohjelmaan liittyvään opiskeluoikeuteen, hänet lasketaan ryhmään ”Passive”.

Paksummilla pystyviivoilla eroteltujen kategorioiden (**Current status**, **Gender**) sarakkeet tuottavat yhteenlaskettuna kentän **All** arvon. **Citizenships**-kategoriat (**Finland** ja **Other**) voivat tuottaa yhteenlaskettuna suuremman tuloksen, koska opiskelijoilla voi olla useampi kuin yksi kansalaisuus.

Jos sivun yläosassa on valittuna ”All study rights” (oletus), mukana ovat myös ohjelmaan siirtyneet ja ohjelmasta pois siirtyneet opiskelijat.

Yläosan valikosta on mahdollista valita tarkasteluun yhden opintosuunnan opiskelijat. Luvut kuvaavat tällöin kyseisen opintosuunnan opiskelijoita.
`,
    studyTrackOverviewCombinedProgramme: '', // Defined below
  },

  basicInformationTab: {
    creditsProducedByTheStudyProgramme: `
Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan. Kategoriat vastaavat Rapon kategorioita. Pistemäärät ovat osin epätarkkoja ennen vuotta 2022 sisu-oodi-erojen vuoksi.

Total-lukuun lasketaan mukaan kaikki opintopisteet **hyväksiluettuja opintopisteitä lukuun ottamatta**.

**Degree students**: Niiden opiskelijoiden opintopisteet, joilla on oikeus suorittaa alempi tai ylempi korkeakoulututkinto.

**Open university**: Avoimen opiskeluoikeus, ei tutkinto-opiskelija: opintosuoritukset, joiden suorituksen luokittelu on "avoimena yliopisto-opintona suoritettu" ja opiskelija ei ole tutkinto-opiskelija tai kansainvälinen vaihto-opiskelija. Avoimen opiskelijat ovat eroteltu suomalaisen henkilötunnuksen omaaviin / hetuttomiin.

**Exchange students**: Saapuvat vaihto-opiskelijat: opintosuoritukset, jotka ovat saapuvan kansainvälisen opiskelijan suorittamia. Sisältää kaikki vaihto-opiskelijan opiskeluoikeuden aikana syntyneet opintopisteet.

**Transferred**: Hyväksiluetut opintopisteet. Tilastointipäivämäärä on hyväksilukupäivämäärä, eli vaikka suoritus olisi vuodelta 2021, jos opintopiste hyväksiluetaan 2024, se lasketaan vuodelle 2024.

**Separate**: Opintosuoritukset, joiden suorituksen luokittelu on "erillisellä opiskeluoikeudella" tai "opettajankoulutuksen erillisellä opiskeluikeudella" suoritettu. Ei sisällä kansainvälisten vaihto-opiskelijoiden suorituksia.

**Other university**: Korkeakoulujen väliset yhteistyöopinnot: opintosuoritukset, jotka on tehty korkeakoulujen väliseen yhteistyösopimukseen perustuvalla opiskeluoikeudella.

**Other**: Sisältää tohtorin- ja lisensiaatintutkintoon liittyvät opintopisteet, täydennyskoulutuksen, erikoistumiskoulutuksen, erikoislääkäri- ja erikoishammaslääkärikoulutuksen sekä lukiolaisten opintopisteet.
`,
    graduatedAndThesisWritersOfTheProgramme: `
**Wrote thesis**: Sisältää kyseisenä vuonna kandidaatin- tai maisterintutkielman hyväksytysti suorittaneet opiskelijat. Mukana ei ole mahdollisia arvosanan korotuksia.

**Graduated**: Sisältää kyseisenä vuonna valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty valmistumispäivän perusteella.
`,
    programmesBeforeOrAfter: `
**Mikäli valittuna on kandiohjelma:** Sisältää maisteriohjelmat, joissa tämän kandiohjelman opiskelijat ovat aloittaneet valmistuttuaan kandeiksi. Vuosijaottelu on tehty maisteriohjelmassa aloittamisen perusteella.

Mukana ovat **vain valmistuneet opiskelijat ja vain maisteriohjelmat.**

**Mikäli valittuna on maisteriohjelma:** Sisältää kandiohjelmat, joissa tämän ohjelman opiskelijat ovat opiskelleet ennen tuloaan maisteriohjelmaan. Vuosijaottelu on tehty maisteriohjelmassa aloittamisen perusteella.
`,
  },

  programmeCoursesTab: {
    byCreditType: `
Opintopisteet ja opiskelijamäärät suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan. Mukana ovat kurssit ja opintokokonaisuudet.

**Degree students**: Suorittajalla on suoritushetkellä ollut ensisijainen opinto-oikeus koulutusohjelmaan (alempi tai ylempi). Sisältää myös ohjelmaan siirtyneet ensisijaiset opiskelijat.

**Open university**: Suorittajalla on ollut suoritushetkellä vain avoimen yliopiston opinto-oikeus.

**Exchange students**: Vaihto-opiskelijan opinto-oikeudella tehdyt suoritukset.

**Other universities**: Korkeakoulujen väliseen yhteistyösopimukseen perustuvalla opinto-oikeudella tehdyt suoritukset.

**Separate studies**: Erillisopinto-oikeudella tai opettajankoulutuksen erillisopinto-oikeudella tehdyt suoritukset.

**Other**: Täydennyskoulutuksen, tohtoreiden, lisensiaattien, lääketieteen/hammaslääketieteen/eläinlääketieten -erikoistumisopintojen, lukiolaisten ja kesäkoulun opinto-oikeuksilla tehdyt suoritukset.

**Transferred credits**: Hyväksiluetut suoritukset (ei lasketa total-sarakkeisiin).

Huom: Oodi/Sisu -datassa olevien puutteiden vuoksi kategorioiden välillä voi esiintyä pieniä eroja (esim. suoritukseen ei liitetty opinto-oikeutta, suoritus kirjattu opinto-oikeuden voimassaoloaikojen ulkopuolelle, yms.).
`,
    studentSwitch: `
**Show credits**: Näyttää hyväksytyistä suorituksesta kertyneet **opintopisteet**  
**Show students**: Näyttää kaikki ilmoittautuneet ja/tai arvosanan saaneet **opiskelijat**
`,
  },

  studyTracksAndClassStatisticsTab: {
    averageGraduationTimesStudyTracks: `
Yksittäinen palkki kertoo, kuinka moni kyseisenä **lukuvuotena ALOITTANEISTA** opiskelijoista on valmistunut.

Vihreä **vaakapalkki** kuvaa tavoiteajassa valmistuneita, keltainen kahden lukukauden sisällä tavoiteajasta valmistuneita ja punainen yli 2 lukukautta tavoiteajan ylittäneitä.

**Breakdown**: Näyttää, kuinka moni kyseisenä lukuvuotena aloittaneista, jo valmistuneista, opiskelijoista valmistui tavoiteajassa, kahden lukukauden sisällä tavoiteajasta tai tätä myöhemmin.

**Median time**: Näyttää valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina sekä heidän prosentuaalisen osuutensa koko vuosikurssista. Vihreä **katkoviiva** kuvastaa tavoiteaikaa. Keltainen katkoviiva on tavoiteaika + 2 lukukautta.

Valmistumisajoista on vähennetty lakisääteiset poissaolot.

Jos sivun yläosassa on valittuna ”All study rights” (oletus), mukana ovat myös ohjelmaan siirtyneet ja ohjelmasta pois siirtyneet opiskelijat.
`,
    progressOfStudents: `
Kuvaa koulutusohjelmassa tiettynä lukuvuonna aloittaneiden opiskelijoiden etenemistä opintopisteissä mitattuna. Esimerkiksi kategoriaan 20–40 kuuluvat opiskelijat, jotka ovat suorittaneet **vähintään 20**, mutta **alle 40** opintopistettä.

Opintopistekertymään on laskettu kaikki suoritukset, jotka opiskelija on suorittanut koulutusohjelmaan siirryttyään. Myös hyväksiluetut ja muuhun kuin valittuun koulutusohjelmaan tai opintosuuntaan tehdyt suoritukset lasketaan mukaan.

Maisteriohjelmien tilastoissa opiskelijat jaetaan kahteen ryhmään: niihin, joilla on oikeus suorittaa sekä kandidaatin että maisterin tutkinto (**Bachelor + master study right**) ja niihin, joilla on oikeus suorittaa vain maisterin tutkinto (**Master study right**). *Bachelor + master study right* -tilastoissa aloitusvuosi on opiskelijan aloitusvuosi kandiohjelmassa, ja mukana ovat kaikki suoritukset, jotka opiskelija on suorittanut aloitettuaan kandiohjelmassa.

Jos sivun yläosassa on valittuna ”All study rights” (oletus), mukana ovat myös ohjelmaan siirtyneet ja ohjelmasta pois siirtyneet opiskelijat.
  `,
    percentiles: {
      fi: `
Näyttää valittuna akateemisena vuonna aloittaneiden opiskelijoiden kumulatiiviset opintopistokertymät persentiileittäin.

Kuvaajiin piirtyy viivoja kuvaamaan kyseisen ohjelman tavoitevalmistumisaikoja, opintopistetavoitteita ja vuosittaista opintopistekertymätavoitetta (60 op per lukuvuosi):

- **Kandiohjelmat**: yleensä 3 vuotta ja 180 op
- **Maisteriohjelmat**: yleensä 2 vuotta ja 120 op

Maisteriohjelmia tarkastellessa näytetään lisäksi kandi+maisteri -oikeudella opiskelevat (yleensä 3v + 2v / 180 op + 120 op). Tällöin näytetään opiskelijat, jotka **ovat aloittaneet kandiohjelmassa valittuna lukukautena, ja ovat jo siirtyneet maisteriohjelmaan**.

**Esim. 75:s persentiili**:
- 25% otannan opiskelijoista on suorittanut enemmän opintopisteitä
- 75% on suorittanut vähemmän opintopisteitä
- Huomaa, että kuvaajassa näkyvät arvot interpoloidaan lineaarisesti opintopistekertymistä, jos opiskelijoiden lukumäärä/opintopistekertymä ei mene muuten tasan kyseisiin väleihin.
  `,
      en: `
Shows the cumulative credit totals of students who began their studies in the selected academic year, broken down by percentile.

Lines are drawn on the graphs to illustrate the target completion times, credit targets for the respective programs, and the yearly credit gain target (60 cr per academic year):

- **Bachelor’s programs**: typically 3 years and 180 credits
- **Master’s programs**: typically 2 years and 120 credits

When viewing master’s programs, students with a combined bachelor’s and master’s study right (typically 3 years + 2 years / 180 credits + 120 credits) are also shown. In this case, the graph shows students who began a bachelor’s program in the selected academic term and have already transferred to a master’s program.

**E.g., 75th percentile**:

- 25% of the sample students have earned more credits
- 75% have earned fewer credits
- Note that the values shown in the graph are linearly interpolated from the cumulative credit totals if the number of students or cumulative credits does not otherwise fall exactly within the specified intervals.`,
    },
    averageGraduationTimesStudyTracksMaster: '', // Defined below
  },

  tagsTab: {
    createNewTag: `
Here you can create tags for degree programme. You can either create public tags or *personal* tags. Tags can be used to combine students from other starting years.
'Associated start year' means what year you want to use as a start year for the students in that tag. For example with this you can move student from earlier starting year to next year if the student was absent during first year.
However this is optional and you can create a new tag without selecting year.
`,
  },

  degreeCoursesTab: {
    creditCriteria: `
Here you can change visibility of degree courses as and set course and credits criteria, for each year their
own. Credits criteria is computed as follows: for the first academic year the credits are taken into account
if they are completed during the first 12 months. For the second year, we take into account the completions
during the first 24 months, for the third year the first 36 months.

The progress of the students by these criteria will be shown in class statistics view.
`,
  },

  // Not used
  notCompleted: `
Sisältää opiskelijat, jotka ovat ilmoittautuneet kurssille, mutta eivät ole suorittaneet sitä ja opiskelijat, jotka ovat saaneet hylätyn arvosanan.
`,
}

studyProgrammeToolTips.common.studyTrackOverviewCombinedProgramme = studyProgrammeToolTips.common.studyTrackOverview
  .replace(
    'Opiskelijoiden, joiden opiskeluoikeuteen kuuluu sekä kandidaatin että maisterin tutkinnon suoritusoikeus, aloituspäivä maisteriohjelmassa on kandidaatin tutkinnon valmistumispäivän jälkeinen päivä.',
    ''
  )
  .replace(
    '- **Graduated**: Koulutusohjelmasta valmistuneet opiskelijat',
    '- **Graduated bachelor**: Kandidaatiksi valmistuneet opiskelijat\n  - **Graduated licentiate**: Lisensiaatiksi valmistuneet opiskelijat'
  )
  .replace(/valmistuneet koulutusohjelmasta/g, 'valmistuneet lisensiaatiksi')
  .replace(
    'kentän **All** arvon.',
    'kentän **All** arvon (lukuun ottamatta *Current status* -kategorian **Graduated bachelor** -saraketta).'
  )

studyProgrammeToolTips.studyTracksAndClassStatisticsTab.averageGraduationTimesStudyTracksMaster =
  studyProgrammeToolTips.studyTracksAndClassStatisticsTab.averageGraduationTimesStudyTracks.replace(
    'on valmistunut.',
    'on valmistunut.\n\n  Maisteriohjelmien tilastoissa opiskelijat on jaettu kahteen ryhmään:\n  - **Bachelor + master study right** -kaaviossa ovat mukana ne opiskelijat, joilla on oikeus suorittaa **sekä kandidaatin että maisterin** tutkinto. Tässä kaaviossa aloitusvuosi tarkoittaa opiskelijan aloitusvuotta kandiohjelmassa.\n  - **Master study right** -kaaviossa ovat mukana ne opiskelijat, joilla on oikeus suorittaa **ainoastaan maisterin** tutkinto.'
  )
