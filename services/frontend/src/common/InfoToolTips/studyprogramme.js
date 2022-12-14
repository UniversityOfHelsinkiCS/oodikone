export default {
  YearToggle: `
  Academic year: Näyttää tilastot akateemisille vuosille jaoteltuna, esimerkiksi 1.8.2019-31.7.2020
  Calendar year: Näyttää tilastot kalenterivuosille jaoteltuna, esimerkiksi 1.1.2019-31.12.2019 
  `,
  StudentToggle: `
  All studyrights: Valinnassa ovat mukana vaihto-opiskelijat, erillisoikeudella opiskelevat ja ohjelmaan siirtyneet opiskelijat sekä ohjelmasta pois siirtyneet opiskelijat.
  
  Special studyrights excluded: Valinnasta ja kaikista luvuista on poissuljettu kaikki edellä mainitut erikoisryhmät.
  `,
  GraduatedToggle: `
  Graduated included: Valinnassa ovat mukana ohjelmasta jo valmistuneet opiskelijat.
  
  Graduated excluded: Valinnasta on poistettu ohjelmasta jo valmistuneet opiskelijat.
  `,
  StudentsOfTheStudyprogramme: `
  **All**: Sisältää kaikki kyseisenä vuonna alkaneet opinto-oikeudet riippumatta siitä, onko opintoja aloitettu tai onko niitä aloitettu ko. vuonna. Mukana myös ohjelmaan siirtyneet opiskelijat.

  **Started studying**: Sisältää kyseisenä vuonna aloittaneet opiskelijat (aloitetut opinto-oikeudet) riippumatta siitä, minä vuonna kyseinen opiskeluoikeus on myönnetty. Opiskelija on myös voinut myöhemmin keskeyttää opintonsa tai siirtyä pois ohjelmasta.\n
  **Graduated**: Sisältää kyseisenä vuonna valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty opinto-oikeuden päättymispäivän (=valmistumispäivän) perusteella.
    
  **Transferred away**: Sisältää kyseisenä vuonna pois ohjelmasta siirtyneet opiskelijat (opinto-oikeudet). Sama opiskelija voi esiintyä tilastoissa useana vuonna, mikäli hän on siirtynyt ohjelmaan ja siitä pois useasti.
  
  **Transferred to**: Sisältää kyseisenä vuonna ohjelmaan siirtyneet opiskelijat (opinto-oikeudet).

  HUOM! Ohjelmaan siirtyneiden määrä on erityisen suuri vuonna 2020, jolloin vanhoista koulutusohjelmista luovuttiin ja opiskelijat siirtyivät uusiin ohjelmiin.
  `,
  CreditsProducedByTheStudyprogramme: `
  Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan.

  **Major students' credits**: Sisältää ne opintopisteet, joiden suorittajalla on suoritushetkellä ollut ensisijainen opinto-oikeus kyseiseen koulutusohjelmaan. Sisältää myös ohjelmaan siirtyneet ensisijaiset opiskelijat.

  **Non-major students' credits**: Sisältää koulutusohjelman tuottamat opintopisteet, joiden suorittajalla EI ole ollut suoritushetkellä ensisijaista opinto-oikeutta kyseiseen koulutusohjelmaan. Sisältää
  esimerkiksi vaihto-opiskelijat ja erillis-opinto-oikeudella opiskelevat. Sisältää myös opintopisteet, jotka opiskelija on suorittanut koulutusohjelmaan ennen opintojen aloittamista koulutusohjelmassa tai opintojen päätyttyä.
  
  **Transferred credits**: Sisältää opintopisteet, jotka on suoritettu kyseisenä vuonna, ja hyväksiluettu tähän koulutusohjelmaan. Mukana ovat kaikenlaisilla opinto-oikeuksilla hyväksiluetut opintopisteet.
  `,
  GraduatedAndThesisWritersOfTheProgramme: `
  **Wrote thesis**: Sisältää kyseisenä vuonna kandidaatintutkielman tai pro gradu-tutkielman hyväksytysti suorittaneet opiskelijat. Mukana ei ole mahdollisia arvosanan korotuksia.

  **Graduated**: Sisältää kyseisenä vuonna valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty opinto-oikeuden päättymispäivän (=valmistumispäivän) perusteella.
  `,
  AverageGraduationTimes: `
  **Median time**: Näyttää valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina.

  **Mean time**: Näyttää valmistuneiden opiskelijoiden opintojen keston **keskiarvon** kuukausina.
  
  Valmistumisajoista on vähennetty lakisääteiset poissaolot.
  
  Yksittäinen palkki kertoo, kuinka moni opiskelija on valmistunut kyseisenä vuonna.
  
  Vihreä **katkoviiva** kuvastaa tavoiteaikaa. Keltainen katkoviiva on tavoiteaika + yksi vuosi.\n
  Vihreä **vaakapalkki** merkitsee, että keskimääräinen valmistumisaika on alle tai yhtä kuin tavoiteaika, keltainen palkki merkitsee korkeintaan vuoden ylitystä
  ja punainen yli vuoden tavoiteajan ylitystä.`,
  AverageGraduationTimesStudytracks: `
  **Median time**: Näyttää valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina.

  **Mean time**: Näyttää valmistuneiden opiskelijoiden opintojen keston **keskiarvon** kuukausina.
  
  Valmistumisajoista on vähennetty lakisääteiset poissaolot.
  
  Yksittäinen palkki kertoo, kuinka moni kyseisenä **lukukautena aloittaneista** opiskelijoista on valmistunut sekä heidän prosentuaalinen osuutensa koko vuosikurssista.
  
  Vihreä **katkoviiva** kuvastaa tavoiteaikaa. Keltainen katkoviiva on tavoiteaika + yksi vuosi.\n
  Vihreä **vaakapalkki** merkitsee, että keskimääräinen valmistumisaika on alle tai yhtä kuin tavoiteaika, keltainen palkki merkitsee korkeintaan vuoden ylitystä
  ja punainen yli vuoden tavoiteajan ylitystä.`,
  ProgrammesBeforeOrAfter: `
  **Mikäli valittuna on kandiohjelma:** Sisältää maisteriohjelmat, joissa tämän kandiohjelman opiskelijat ovat aloittaneet valmistuttuaan kandeiksi. Vuosijaottelu on tehty maisteriohjelmassa aloittamisen perusteella.

  Mukana ovat **vain valmistuneet opiskelijat ja vain maisteriohjelmat.**

  **Mikäli valittuna on maisteriohjelma:** Sisältää kandiohjelmat, joissa tämän ohjelman opiskelijat ovat opiskelleet ennen tuloaan maisteriohjelmaan. Vuosijaottelu on tehty maisteriohjelmassa aloittamisen perusteella.
  `,
  StudytrackOverview: `  
  Kuvaa koulutusohjelman kyseiseen ohjelmaan opinto-oikeudella varustettujen opiskelijoiden etenemistä opintopisteissä mitattuna. Esimerkiksi 2020-2021 aloittaneiden opintopistejakaumaa.
  
  HUOM!
  **All** Sisältää kaikki opiskelijat, joiden opinto-oikeudella on aloituspäivä kyseisenä vuonna, riippumatta siitä, onko opiskelija aloittanut opiskelemaan ko. vuonna.
  **Started studying** Sisältää kaikki opiskelijat, jotka ovat aloittaneet opiskelemaan koulutusohjelmassa kyseisenä lukuvuonna.
  **Inactive** Sisältää kaikki opinto-oikeudet, jotka ovat alkaneet kyseisenä vuonna, mutta jotka ovat sittemmin vanhentuneet ilman, että opiskelija on valmistunut ohjelmasta. Sisältää myös opinto-oikeudet,
  joissa opiskelija on laiminlyönyt ilmoittautumisen tälle lukukaudelle.
  
  Mukana ovat oletusarvoisesti myös vaihto-opiskelijat, ohjelmaan ja siitä pois siirtyneet opiskelijat sekä erillisopinto-oikeudella opiskelevat.
  Taulukko näyttää myös näistä opiskelijoista miesten, naisten ja suomalaisten osuudet sekä valmistuneiden määrän. 

  Yläosan valikosta on mahdollista valita tarkasteluun yhden opintosuunnan opiskelijat. Sekä opiskelijoiden yleistiedot että edistyminen opintopisteittäin
  kuvaavat tällöin kyseisen opintosuunnan opiskelijoita.
  `,
  StudytrackProgress: `
  Kuvaa koulutusohjelman kyseiseen ohjelmaan opinto-oikeudella varustettujen opiskelijoiden etenemistä opintopisteissä mitattuna. Esimerkiksi 2020-2021 aloittaneiden opintopistejakaumaa.
  
  HUOM! Mukana ovat myös muuhun kuin valittuun koulutusohjelmaan tai opintosuuntaan tehdyt opintopisteet.

  Mukana ovat oletusarvoisesti myös vaihto-opiskelijat, erillisopinto-oikeudella opiskelevat ja ohjelmaan siirtyneet.   

  Mikäli yläosan valikosta valittuna on jokin tietty opintosuunta, myös nämä graafit ja taulukot kuvaavat kyseisen opintosuunnan opiskelijoita.    
  `,
  NonDegree: `
  Opiskelijat, joilla ei ole tutkinto-oikeutta Helsingin yliopistossa.
  `,
  TransferredCourses: `
  Sisältää opiskelijat, jotka ovat suorittaneet kyseisenä vuonna hyväksiluettuja opintopisteitä tähän koulutusohjelmaan. Mukana ovat kaikenlaisilla opinto-oikeuksilla hyväksiluetut opintopisteet
  `,
  TransferredCredits: `
  Sisältää opintopisteet, jotka ovat suoritettu kyseisenä vuonna, ja hyväksiluettu tähän koulutusohjelmaan. Mukana ovat kaikenlaisilla opinto-oikeuksilla hyväksiluetut opintopisteet
  `,
}
