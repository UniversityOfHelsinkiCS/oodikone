export default {
  ProgrammeToggle: `
    New study programmes: Näyttää kaikissa luvuissa ja kuvaajissa pelkästään uuden opetussuunnitelman ohjelmat.
    All programmes: Näyttää kaikissa luvuissa ja kuvaajissa kuvaajissa myös vanhan opetussuunnitelman ohjelmat.`,
  YearToggle: `
    Academic year: Näyttää tilastot akateemisille vuosille jaoteltuna, esimerkiksi 1.8.2019-31.7.2020
    Calendar year: Näyttää tilastot kalenterivuosille jaoteltuna, esimerkiksi 1.1.2019-31.12.2019 
    `,
  StudentsOfTheFaculty: `
  **Started studying**: Sisältää kyseisenä vuonna tiedekunnassa aloittaneet opiskelijat (aloitetut opinto-oikeudet) riippumatta siitä, minä vuonna kyseinen opiskeluoikeus on myönnetty. Opiskelija on myös voinut myöhemmin keskeyttää opintonsa tai siirtyä pois ohjelmasta.
    Kandi-maisteri-opinto-oikeudellisista opiskelijoista lasketaan vain kandissa ts. tiedekunnassa aloitus, ei toistamiseen enää maisteriopintojen aloitusta.\n
  **Graduated**: Sisältää kyseisenä vuonna valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty opinto-oikeuden päättymispäivän (=valmistumispäivän) perusteella.
  
  **Transferred inside**: Sisältää kyseisenä vuonna tiedekunnan sisällä siirtyneet opiskelijat (opinto-oikeudet). Ohjelmakohtaisissa tilastoissa siirto on laskettu kohdeohjelman tilastoihin.

  **Transferred away**: Sisältää kyseisenä vuonna pois tiedekunnasta siirtyneet opiskelijat (opinto-oikeudet). Sama opiskelija voi esiintyä tilastoissa useana vuonna, mikäli hän on siirtynyt tiedekuntaan ja siitä pois useasti.
  
  **Transferred to**: Sisältää kyseisenä vuonna tiedekuntaan siirtyneet opiskelijat (opinto-oikeudet).

  HUOM! Siirtyneiden määrä on erityisen suuri vuonna 2020, jolloin vanhoista koulutusohjelmista luovuttiin ja opiskelijat siirtyivät uusiin ohjelmiin.
  `,
  CreditsProducedByTheFaculty: `
  Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan.

  **Major students credits**: Sisältää ne opintopisteet, joiden suorittajalla on suoritushetkellä ollut ensisijainen opinto-oikeus johonkin tiedekunnan koulutusohjelmaan. Sisältää myös tiedekunnan ohjelmaan siirtyneet ensisijaiset opiskelijat.

  **Non-major faculty students credits**: Sisältää tiedekunnan koulutusohjelmien tuottamat opintopisteet, joiden suorittajalla EI ole ollut suoritushetkellä ensisijaista opinto-oikeutta kyseiseen koulutusohjelmaan,
  MUTTA hänellä on sellainen johonkin toiseen tiedekunnan ohjelmaan. Sisältää esimerkiksi vaihto-opiskelijat ja erillis-opinto-oikeudella opiskelevat.
  Sisältää myös opintopisteet, jotka opiskelija on suorittanut koulutusohjelmaan ennen opintojen aloittamista koulutusohjelmassa tai opintojen päätyttyä.
  
  **Non-major other faculty students credits**: Sisältää tiedekunnan koulutusohjelmien tuottamat opintopisteet, joiden suorittajalla EI ole ollut suoritushetkellä ensisijaista opinto-oikeutta kyseiseen koulutusohjelmaan tai mihinkään muuhun kyseisen tiedekunnan koulutusohjelmaan.
  Sisältää esimerkiksi vaihto-opiskelijat ja erillis-opinto-oikeudella opiskelevat. Sisältää myös opintopisteet, jotka opiskelija on suorittanut koulutusohjelmaan ennen opintojen aloittamista koulutusohjelmassa tai opintojen päätyttyä.
  
  **Non-degree student credits**: Sisältää tiedekuntaan suoritetut opintopisteet, joiden suorittajilla ei ole tutkinto-oikeutta Helsingin yliopistossa.
  `,
  GraduatedOfTheFaculty: `Sisältää kyseisenä vuonna tiedekunnasta valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty opinto-oikeuden päättymispäivän (=valmistumispäivän) perusteella.`,
  ThesisWritersOfTheFaculty: `Sisältää kyseisenä vuonna kandidaatintutkielman, pro gradu -tutkielman, väitöskirjan tai lisensiaatintyön hyväksytysti suorittaneet opiskelijat. Mukana ei ole mahdollisia arvosanan korotuksia.`,
  StudentToggle: `
  All studyrights: Valinnassa ovat mukana vaihto-opiskelijat, erillisoikeudella opiskelevat ja ohjelmaan siirtyneet opiskelijat sekä ohjelmasta pois siirtyneet opiskelijat.\n
  Special studyrights excluded: Valinnasta ja kaikista luvuista on poissuljettu kaikki edellä mainitut erikoisryhmät.
  `,

  // Graduation times
  GroupByToggle: `Group by: Starting year: Valmistuneet opiskelijat on jaoteltu opinto-oikeuden alkuvuoden mukaan.\n
  Graduation year: Valmistuneet opiskelijat on ryhmitelty opintojen valmistumisvuoden perusteella.`,
  AverageGraduationTimes: `
  Opiskelijoiden keskimääräiset valmistumisajat tutkintotasoittain. 

  - Bachelor: Kandidaatin tutkinnon suoritusajat
  - Bachelor + Master: Kandi+maisteriopinto-oikeudella opiskelleiden ja siitä maisteriksi valmistuneiden suoritusajat
  - Master: Pelkällä maisterintutkinnon opinto-oikeudella opiskelleiden suoritusajat
  - Doctor: Tohtorin tutkinnon suoritusajat
  - Licentiate: Lisensiaatin tutkinnon suoritusajat

  Valmistumisajoista on **vähennetty lakisääteiset poissaolot**. Vihreä katkoviiva kuvastaa tavoiteaikaa. 
  Vihreä palkki merkitsee, että keskimääräinen valmistumisaika on alle tai yhtä kuin tavoiteaika, keltainen palkki merkitsee korkeintaan vuoden ylitystä
  ja punainen yli vuoden tavoiteajan ylitystä.

  Palkissa oleva lukumäärä kertoo **montako opiskelijaa** kuhunkin valmistuneiden ryhmään kuuluu. 
  Tarkastellessa valmistumisaikoja aloitusvuosittain palkissa näkyy myös **kuinka suuri osa** kyseisenä vuonna tiedekuntaan/opinto-ohjelmaan opinto-oikeuden saaneista on valmistunut.


  Säädöt:

  **Starting year**. Ryhmittelee tulokset opiskelijoiden opinto-oikeuden alkamisvuosittain. Näyttää siis vuonna xxxx aloittaneiden opiskelijoiden keskimääräiset valmistumisajat. Luvut voivat elää, koska osa vuonna xxxx 
  aloittaneiden opiskelijoiden opinnoista voi olla edelleen kesken.

  **Graduation year**: Ryhmittelee tulokset valmistumisvuosittain. Näyttää siis vuonna xxxx valmistuneiden opiskelijoiden keskimääräiset valmistumisajat. 
  Luvut ovat lopullisia (kuluva vuosi poislukien), sillä edeltäville vuosille ei tule uusia valmistumisia.

  **Median time**: Näyttää kyseisenä vuonna valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina.

  **Mean time**: Näyttää kyseisenä vuonna valmistuneiden opiskelijoiden opintojen keston **keskiarvon** kuukausina.`,

  // Faculty Student population
  GraduatedToggle: `
  Graduated included: Valinnassa ovat mukana ohjelmasta jo valmistuneet opiskelijat.

  Graduated excluded: Valinnasta on poistettu ohjelmasta jo valmistuneet opiskelijat.
  `,
  StudentsStatsOfTheFaculty: ``,
  BachelorsProgress: ``,
  BachelorMastersProgress: ``,
  MastersProgress: ``,
  DoctoralProgress: ``,
}
