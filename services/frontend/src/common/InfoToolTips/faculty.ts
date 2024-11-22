import { studyProgrammeToolTips } from './studyProgramme'

export const facultyToolTips: Record<string, string> = {
  programmeToggle: `
    **New study programmes**: Näyttää kaikissa luvuissa ja kuvaajissa pelkästään uuden opetussuunnitelman ohjelmat.  
    **All study programmes**: Näyttää kaikissa luvuissa ja kuvaajissa kuvaajissa myös vanhan opetussuunnitelman ohjelmat.
  `,
  creditsProducedByTheFaculty: `
    Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan. Kategoriat vastaavat Rapon kategorioita. Pistemäärät ovat osin epätarkkoja ennen vuotta 2022 sisu-oodi-erojen vuoksi.

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
  graduatedOfTheFaculty: `
    Sisältää kyseisenä vuonna tiedekunnasta valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty.
    Jaottelu on tehty opinto-oikeuden päättymispäivän (=valmistumispäivän) perusteella.
  `,
  thesisWritersOfTheFaculty: `
    Sisältää kyseisenä vuonna kandidaatin- tai maisterintutkielman hyväksytysti suorittaneet opiskelijat.
    Mukana ei ole mahdollisia arvosanan korotuksia.
  `,
  averageGraduationTimes: `
    Opiskelijoiden keskimääräiset valmistumisajat tutkintotasoittain. 

    - **Bachelor**: Kandidaatin tutkinnon suorittaneet opiskelijat
    - **Bachelor + Master**: Opiskelijat, joiden opiskeluoikeuteen kuuluu **sekä kandidaatin että maisterin** tutkinnon suoritusoikeus
    - **Master**: Opiskelijat, joiden opiskeluoikeuteen kuuluu **vain** maisterin tutkinnon suoritusoikeus
    - **Doctor**: Tohtorin tutkinnon suorittaneet opiskelijat

    Valmistumisajoista on **vähennetty lakisääteiset poissaolot**.
    Luvuissa ei ole mukana opiskelijoita, jotka ovat vaihtaneet koulutuohjelmaa saman opiskeluoikeuden sisällä (pois lukien kandiohjelmasta maisteriohjelmaan siirtyneet).
    Toisin sanoen luvut vastaavat *Study programme overview* -näkymän lukuja, kun näkymässä on valittuna *Special study rights excluded*.

    - **Breakdown**/**Median study times**:
      - **Breakdown**: Näyttää, kuinka moni opiskelija valmistui tavoiteajassa (vihreä palkki), 12 kuukauden sisällä tavoiteajasta (keltainen palkki) tai tätä myöhemmin (punainen palkki).
      - **Median study times**: Näyttää kyseisenä kalenteri- tai lukuvuonna aloittaneiden/valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina. Vihreä **katkoviiva** kuvastaa tavoiteaikaa. Keltainen katkoviiva on tavoiteaika + 12 kuukautta.  
    - **Graduation year**/**Starting year**:
      - **Graduation year**: Ryhmittelee opiskelijat valmistumisvuosittain (kalenterivuosi).
      - **Starting year**: Ryhmittelee opiskelijat opiskeluoikeuden alkamisvuoden (lukuvuosi) perusteella. Bachelor + Master -kuvaajassa aloitusvuosi on aloitusvuosi kandiohjelmassa ja koulutusohjelma on maisteriohjelma, johon opiskelija on siirtynyt kandidaatiksi valmistumisen jälkeen.  
 `,
  studentProgress: `
    Kuvaa tiedekuntaan kuuluvien eri ohjelmien opinto-oikeudella varustettujen opiskelijoiden etenemistä opintopisteissä mitattuna.
    Esimerkiksi 2021-2022 aloittaneiden opintopistejakaumaa.

    - Bachelor: Kandidaatin opinto-oikeudella varustettujen opiskelijoiden eteneminen
    - Bachelor + Master: Kandi+maisteriopinto-oikeudella opiskelleiden ja siitä maisteriksi ohjelmiin siirtyneiden etenenminen. Aloitusvuodeksi on merkitty kandiohjelman aloitusvuosi. 
      Opinto-ohjelmaksi on merkitty maisteriohjelma, johon opiskelija on siirtynyt kandiksi valmistumisen jälkeen.
    - Master: Pelkällä maisterintutkinnon opinto-oikeudella varustettujen opiskelijoiden eteneminen 
    - Doctor: Tohtorin opinto-oikeudella varustettujen opiskelijoiden eteneminen

    HUOM! Mukana ovat myös muuhun kuin valittuun koulutusohjelmaan tai opintosuuntaan tehdyt opintopisteet.
    Opintopisteet on laskettu opinto-oikeuden alkamisesta, eikä tällä hetkellä ota huomioon mahdollisia hyväksilukuja.

    Mukana ovat oletusarvoisesti myös ohjelmaan siirtyneet.
  `,
  bachelorMasterProgress: `
    The starting year is the study right start in the bachelor programme. The credits are computed by the
    start date of the bachelor programme and at the moment, they do not include any transferred credits.
    Thus, in these statistics some students have fewer credits than in reality.
  `,
}

facultyToolTips.studentsStatsOfTheFaculty = studyProgrammeToolTips.studyTrackOverview.replace(
  'Yläosan valikosta on mahdollista valita tarkasteluun yhden opintosuunnan opiskelijat. Luvut kuvaavat tällöin kyseisen opintosuunnan opiskelijoita.',
  ''
)
facultyToolTips.studentsOfTheFaculty =
  'Taulukon luvut on laskettu **yhdistämällä** tiedekunnan koulutusohjelmien luvut. Näin ollen tämän näkymän luvut täsmäävät *Study programme* -näkymän lukuihin. Kategorioiden merkitykset ovat seuraavat:\n'
    .concat(studyProgrammeToolTips.studentsOfTheStudyProgramme)
    .replace('Transferred away', 'Transferred out of programme')
    .replace('Transferred to', 'Transferred into programme')
facultyToolTips.graduatedToggle = studyProgrammeToolTips.graduatedToggle
facultyToolTips.studentToggle = studyProgrammeToolTips.studentToggle
facultyToolTips.yearToggle = studyProgrammeToolTips.yearToggle
