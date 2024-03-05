export const facultyToolTips = {
  ProgrammeToggle: `
    New study programmes: Näyttää kaikissa luvuissa ja kuvaajissa pelkästään uuden opetussuunnitelman ohjelmat.
    All programmes: Näyttää kaikissa luvuissa ja kuvaajissa kuvaajissa myös vanhan opetussuunnitelman ohjelmat.`,
  YearToggle: `
    Academic year: Näyttää tilastot akateemisille vuosille jaoteltuna, esimerkiksi 1.8.2019-31.7.2020
    Calendar year: Näyttää tilastot kalenterivuosille jaoteltuna, esimerkiksi 1.1.2019-31.12.2019 
    `,
  StudentsOfTheFaculty: `
  **Started studying**: Sisältää kyseisenä vuonna tiedekunnassa aloittaneet opiskelijat (aloitetut opinto-oikeudet) opiskelijat. Opiskelija on voinut myöhemmin keskeyttää opintonsa tai siirtyä pois ohjelmasta.
    Kandi-maisteri-opinto-oikeudellisista opiskelijoista lasketaan vain kandissa ts. tiedekunnassa aloitus, ei toistamiseen enää maisteriopintojen aloitusta.\n
  **Graduated**: Sisältää kyseisenä vuonna valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty opinto-oikeuden päättymispäivän (=valmistumispäivän) perusteella.
  
  **Transferred inside**: Sisältää kyseisenä vuonna tiedekunnan sisällä siirtyneet opiskelijat (opinto-oikeudet). Ohjelmakohtaisissa tilastoissa siirto on laskettu kohdeohjelman tilastoihin.

  **Transferred away**: Sisältää opiskelijat, joiden opinto-oikeuden vastuutiedekunta on muuttunut kyseisen vuoden aikana. Sama opiskelija voi esiintyä tilastoissa useana vuonna, mikäli vastuutiedekunta on muuttunut useasti takaisin tiedekuntaan ja pois siitä.
  
  **Transferred to**: Sisältää kyseisenä vuonna tiedekuntaan siirtyneet opiskelijat (opinto-oikeudet).

  HUOM! Siirtyneiden määrä on erityisen suuri vuonna 2020, jolloin vanhoista koulutusohjelmista luovuttiin ja opiskelijat siirtyivät uusiin ohjelmiin.
  `,
  CreditsProducedByTheFaculty: `Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan. Kategoriat vastaavat Rapon kategorioita. Pistemäärät ovat osin epätarkkoja ennen vuotta 2022 sisu-oodi-erojen vuoksi.

  Kurssin järjestäjä voi olla joko tiedekunnan koulutusohjelma tai tiedekunta itse. Tiedekunnan pisteet on laskettu yhteen lukemiin, ja näkyy erillisenä koulutusohjelmien kanssa tarkasteltaessa taulukosta aukeavia vuosia.

  Total-kategoriaan ei lasketa mukaan hyväksiluettuja opintopisteitä.

  **Degree students**: Niiden opiskelijoiden opintopisteet, joilla on oikeus suorittaa alempi tai ylempi korkeakoulututkinto.

  **Open university**: Avoimen opiskeluoikeus, ei tutkinto-opiskelija: opintosuoritukset, joiden suorituksen luokittelu on "avoimena yliopisto-opintona suoritettu" ja opiskelija ei ole tutkinto-opiskelija tai kansainvälinen vaihto-opiskelija.

  **Exchange students**: Saapuvat vaihto-opiskelijat: opintosuoritukset, jotka ovat saapuvan kansainvälisen opiskelijan suorittamia. 
  Sisältää kaikki vaihto-opiskelijan opiskeluoikeuden aikana syntyneet opintopisteet.
  
  **Transferred**: Hyväksiluetut opintopisteet. Tilastointipäivämäärä on hyväksilukupäivämäärä, eli vaikka suoritus olisi vuodelta 2021, jos opintopiste hyväksiluetaan 2024, se lasketaan vuodelle 2024.

  Lisäksi painamalla "Show special categories" -valintaa, saat näkyviin myös harvinaisemmat kategoriat:
  
  **Special**: 
  Opintosuoritukset, joiden suorituksen luokittelu on "erillisellä opiskeluoikeudella" tai "opettajankoulutuksen erillisellä opiskeluikeudella" suoritettu. Ei sisällä kansainvälisten vaihto-opiskelijoiden suorituksia.
  Ulkomailta hyväksiluetut opintopisteet: ulkomailta hyväksilutetut opintopisteet.

  **Other university**:
  Korkeakoulujen väliset yhteistyöopinnot: opintosuoritukset, jotka on tehty korkeakoulujen väliseen yhteistyösopimukseen perustuvalla opiskeluoikeudella.

  `,

  GraduatedOfTheFaculty:
    'Sisältää kyseisenä vuonna tiedekunnasta valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty opinto-oikeuden päättymispäivän (=valmistumispäivän) perusteella.',
  ThesisWritersOfTheFaculty:
    'Sisältää kyseisenä vuonna kandidaatintutkielman tai pro gradu -tutkielman suorittaneet opiskelijat. Mukana ei ole mahdollisia arvosanan korotuksia.',
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
  StudentsStatsOfTheFaculty: `
  Kuvaa tiedekunnan ohjelmissa opiskelevien opiskelijoden tilastoja. Esimerkiksi 2020-2021 aloittaneiden opintopistejakaumaa.
  
  HUOM!
  - **All** Sisältää opiskelijat, jotka siirtyneet ohjelmaan tai siitä ulos sekä aloittaneet ohjelmassa
  - **Currently enrolled** Sisältää kaikki tällä hetkellä läsnäolevat olevat opiskelija.
  - **Absent** Sisältää kaikki lakisääteisistä syistä poissaolevat opiskelijat.
  - **Started studying** Sisältää kyseisenä lukuvuonna ohjelmassa aloittaneet opiskelijat. Opiskelija on voinut myöhemmin keskeyttää opintonsa tai siirtyä pois ohjelmasta.
  - **Inactive** Sisältää kaikki opinto-oikeudet, jotka ovat alkaneet kyseisenä vuonna, mutta jotka ovat sittemmin vanhentuneet ilman, että opiskelija on valmistunut ohjelmasta. Sisältää myös opinto-oikeudet,
  joissa opiskelija on laiminlyönyt ilmoittautumisen tälle lukukaudelle.
  
  Mukana ovat oletusarvoisesti myös ohjelmaan ja siitä pois siirtyneet opiskelijat.
  Taulukko näyttää myös näistä opiskelijoista miesten, naisten ja suomalaisten osuudet sekä valmistuneiden määrän. `,
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
