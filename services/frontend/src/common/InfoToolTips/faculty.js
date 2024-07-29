import { studyProgrammeToolTips } from './studyprogramme'

export const facultyToolTips = {
  ProgrammeToggle: `
    New study programmes: Näyttää kaikissa luvuissa ja kuvaajissa pelkästään uuden opetussuunnitelman ohjelmat.
    All programmes: Näyttää kaikissa luvuissa ja kuvaajissa kuvaajissa myös vanhan opetussuunnitelman ohjelmat.`,
  YearToggle: `
    Academic year: Näyttää tilastot akateemisille vuosille jaoteltuna, esimerkiksi 1.8.2019-31.7.2020
    Calendar year: Näyttää tilastot kalenterivuosille jaoteltuna, esimerkiksi 1.1.2019-31.12.2019 
    `,
  CreditsProducedByTheFaculty: `Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan. Kategoriat vastaavat Rapon kategorioita. Pistemäärät ovat osin epätarkkoja ennen vuotta 2022 sisu-oodi-erojen vuoksi.

  Kurssin järjestäjä voi olla joko tiedekunnan koulutusohjelma tai tiedekunta itse. Tiedekunnan pisteet on laskettu yhteen lukemiin, ja näkyy erillisenä koulutusohjelmien kanssa tarkasteltaessa taulukosta aukeavia vuosia.

  Total-lukuun lasketaan mukaan kaikki opintopisteet **hyväksiluettuja opintopisteitä lukuun ottamatta**.

  **Degree students**: Niiden opiskelijoiden opintopisteet, joilla on oikeus suorittaa alempi tai ylempi korkeakoulututkinto.

  **Open university**: Avoimen opiskeluoikeus, ei tutkinto-opiskelija: opintosuoritukset, joiden suorituksen luokittelu on "avoimena yliopisto-opintona suoritettu" ja opiskelija ei ole tutkinto-opiskelija tai kansainvälinen vaihto-opiskelija.

  **Exchange students**: Saapuvat vaihto-opiskelijat: opintosuoritukset, jotka ovat saapuvan kansainvälisen opiskelijan suorittamia. Sisältää kaikki vaihto-opiskelijan opiskeluoikeuden aikana syntyneet opintopisteet.
  
  **Transferred**: Hyväksiluetut opintopisteet. Tilastointipäivämäärä on hyväksilukupäivämäärä, eli vaikka suoritus olisi vuodelta 2021, jos opintopiste hyväksiluetaan 2024, se lasketaan vuodelle 2024.

  Lisäksi painamalla "Show special categories" -valintaa, saat näkyviin myös harvinaisemmat kategoriat:
  
  **Separate**: Opintosuoritukset, joiden suorituksen luokittelu on "erillisellä opiskeluoikeudella" tai "opettajankoulutuksen erillisellä opiskeluikeudella" suoritettu. Ei sisällä kansainvälisten vaihto-opiskelijoiden suorituksia.

  **Other university**: Korkeakoulujen väliset yhteistyöopinnot: opintosuoritukset, jotka on tehty korkeakoulujen väliseen yhteistyösopimukseen perustuvalla opiskeluoikeudella.
  `,

  GraduatedOfTheFaculty:
    'Sisältää kyseisenä vuonna tiedekunnasta valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty opinto-oikeuden päättymispäivän (=valmistumispäivän) perusteella.',
  ThesisWritersOfTheFaculty:
    'Sisältää kyseisenä vuonna kandidaatin- tai maisterintutkielman hyväksytysti suorittaneet opiskelijat. Mukana ei ole mahdollisia arvosanan korotuksia.',
  StudentToggle: `
  All studyrights: Valinnassa ovat mukana vaihto-opiskelijat, erillisoikeudella opiskelevat ja ohjelmaan siirtyneet opiskelijat sekä ohjelmasta pois siirtyneet opiskelijat.\n
  Special studyrights excluded: Valinnasta ja kaikista luvuista on poissuljettu kaikki edellä mainitut erikoisryhmät.
  `,

  // Graduation times
  GroupByToggle: `Graduation year: Valmistuneet opiskelijat on ryhmitelty opintojen valmistumisvuoden perusteella.\n
    Group by: Starting year: Valmistuneet opiskelijat on jaoteltu opinto-oikeuden alkuvuoden mukaan.
  `,
  AverageGraduationTimes: `
  Opiskelijoiden keskimääräiset valmistumisajat tutkintotasoittain. 

  - Bachelor: Kandidaatin tutkinnon suoritusajat
  - Bachelor + Master: Kandi+maisteriopinto-oikeudella opiskelleiden ja siitä maisteriksi valmistuneiden suoritusajat
  - Master: Pelkällä maisterintutkinnon opinto-oikeudella opiskelleiden suoritusajat
  - Doctor: Tohtorin tutkinnon suoritusajat
  - Licentiate: Lisensiaatin tutkinnon suoritusajat

  Valmistumisajoista on **vähennetty lakisääteiset poissaolot**. 

  Palkissa oleva lukumäärä kertoo **montako opiskelijaa** kuhunkin valmistuneiden ryhmään kuuluu.

  Vihreä **vaakapalkki** kuvaa tavoiteajassa (tai alle) valmistuneista, keltainen palkki korkeintaan vuodella tavoiteajan ylittäneitä
  ja punainen yli vuodella tavoiteajan ylittäneitä.

  Säädöt:

  **Breakdown**: Näyttää, kuinka moni opiskelija valmistui ajallaan, korkeintaan vuoden myöhässä tavoiteajasta tai tätä myöhemmin.

  **Median time**: Näyttää kyseisenä vuonna/lukuvuonna valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina.

  **Graduation year**: Ryhmittelee tulokset valmistumisvuosittain. Näyttää siis vuonna xxxx valmistuneiden opiskelijoiden keskimääräiset valmistumisajat. 
  Luvut ovat lopullisia (kuluva vuosi poislukien), sillä edeltäville vuosille ei tule uusia valmistumisia.

  **Starting year**. Ryhmittelee tulokset opiskelijoiden opinto-oikeuden alkamisvuosittain. Näyttää siis vuonna xxxx aloittaneiden opiskelijoiden keskimääräiset valmistumisajat. Luvut voivat elää, koska osa vuonna xxxx 
  aloittaneiden opiskelijoiden opinnoista voi olla edelleen kesken.

  Mediaaninäkymässä vihreä **katkoviiva** kuvastaa tavoiteaikaa. Keltainen katkoviiva on tavoiteaika + yksi vuosi.\n

  Tarkastellessa valmistumisaikoja aloitusvuosittain palkissa näkyy myös **kuinka suuri osa** kyseisenä vuonna tiedekuntaan/opinto-ohjelmaan opinto-oikeuden saaneista on valmistunut.
 `,

  // Faculty Student population
  GraduatedToggle: `
  Graduated included: Valinnassa ovat mukana ohjelmasta jo valmistuneet opiskelijat.

  Graduated excluded: Valinnasta on poistettu ohjelmasta jo valmistuneet opiskelijat.
  `,
  StudentProgress: `
  Kuvaa tiedekuntaan kuuluvien eri ohjemien opinto-oikeudella varustettujen opiskelijoiden etenemistä opintopisteissä mitattuna. Esimerkiksi 2021-2022 aloittaneiden opintopistejakaumaa.
  
  - Bachelor: Kandidaatin opinto-oikeudella varustettujen opiskelijoiden eteneminen
  - Bachelor + Master: Kandi+maisteriopinto-oikeudella opiskelleiden ja siitä maisteriksi ohjelmiin siirtyneiden etenenminen. Aloitusvuodeksi on merkitty kandiohjelman aloitusvuosi. 
    Opinto-ohjelmaksi on merkitty maisteriohjelma, johon opiskelija on siirtynyt kandiksi valmistumisen jälkeen.
  - Master: Pelkällä maisterintutkinnon opinto-oikeudella varustettujen opiskelijoiden eteneminen 
  - Doctor: Tohtorin opinto-oikeudella varustettujen opiskelijoiden eteneminen
  
  HUOM! Mukana ovat myös muuhun kuin valittuun koulutusohjelmaan tai opintosuuntaan tehdyt opintopisteet. Opintopisteet on laskettu opinto-oikeuden alkamisesta, eikä tällä hetkellä ota huomioon mahdollisia hyväksilukuja.

  Mukana ovat oletusarvoisesti myös ohjelmaan siirtyneet.
  `,
}

facultyToolTips.StudentsStatsOfTheFaculty = studyProgrammeToolTips.StudytrackOverview.replace(
  'Yläosan valikosta on mahdollista valita tarkasteluun yhden opintosuunnan opiskelijat. Luvut kuvaavat tällöin kyseisen opintosuunnan opiskelijoita.',
  ''
)
facultyToolTips.StudentsOfTheFaculty =
  'Taulukon luvut on laskettu **yhdistämällä** tiedekunnan koulutusohjelmien luvut. Näin ollen tämän näkymän luvut täsmäävät *Study programme* -näkymän lukuihin. Kategorioiden merkitykset ovat seuraavat:\n'
    .concat(studyProgrammeToolTips.StudentsOfTheStudyprogramme)
    .replace('Transferred away', 'Transferred out of programme')
    .replace('Transferred to', 'Transferred into programme')
