export const studyProgrammeToolTips: Record<string, string> = {
  YearToggle: `
  **Calendar year**: Näyttää tilastot kalenterivuosille jaoteltuna (esim. 1.1.–31.12.2024)  
  **Academic year**: Näyttää tilastot lukuvuosille jaoteltuna (esim. 1.8.2023–31.7.2024)
  `,
  StudentToggle: `
  **All study rights**: Valinnassa ovat mukana vaihto-opiskelijat, erillisoikeudella opiskelevat ja ohjelmaan siirtyneet opiskelijat sekä ohjelmasta pois siirtyneet opiskelijat.  
  **Special study rights excluded**: Valinnasta ja kaikista luvuista on poissuljettu kaikki edellä mainitut erikoisryhmät.
  `,
  GraduatedToggle: `
  **Graduated included**: Valinnassa ovat mukana ohjelmasta jo valmistuneet opiskelijat.  
  **Graduated excluded**: Valinnasta on poistettu ohjelmasta jo valmistuneet opiskelijat.
  `,
  StudentsOfTheStudyProgramme: `
  **Started studying**: Sisältää opiskelijat, jotka ovat kyseisenä vuonna ilmoittautuneet ensimmäistä kertaa läsnäolevaksi koulutusohjelmassa. Opiskelija on voinut myös myöhemmin keskeyttää opintonsa tai siirtyä pois ohjelmasta.

  **Accepted**: Sisältää opiskelijat, joiden opiskeluoikeus koulutusohjelmassa on alkanut kyseisenä vuonna. Opiskelija on saattanut ilmoittautua poissaolevaksi tai jättää lukuvuosi-ilmoittautumisen kokonaan tekemättä.

  **Graduated**: Sisältää kyseisenä vuonna valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty.
    
  **Transferred away**: Sisältää kyseisenä vuonna pois ohjelmasta siirtyneet opiskelijat (opiskeluoikeudet). Sama opiskelija voi esiintyä tilastoissa useana vuonna, mikäli hän on siirtynyt ohjelmaan ja siitä pois useasti.
  
  **Transferred to**: Sisältää kyseisenä vuonna ohjelmaan siirtyneet opiskelijat (opiskeluoikeudet). Ohjelmaan siirtyneiden määrä on erityisen suuri vuonna 2020, jolloin opiskelijat siirtyivät vanhoista koulutusohjelmista uusiin ohjelmiin.
  `,
  CreditsProducedByTheStudyProgramme: `
  Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan. Kategoriat vastaavat Rapon kategorioita. Pistemäärät ovat osin epätarkkoja ennen vuotta 2022 sisu-oodi-erojen vuoksi.

  Total-lukuun lasketaan mukaan kaikki opintopisteet **hyväksiluettuja opintopisteitä lukuun ottamatta**.

  **Degree students**: Niiden opiskelijoiden opintopisteet, joilla on oikeus suorittaa alempi tai ylempi korkeakoulututkinto.

  **Open university**: Avoimen opiskeluoikeus, ei tutkinto-opiskelija: opintosuoritukset, joiden suorituksen luokittelu on "avoimena yliopisto-opintona suoritettu" ja opiskelija ei ole tutkinto-opiskelija tai kansainvälinen vaihto-opiskelija.

  **Exchange students**: Saapuvat vaihto-opiskelijat: opintosuoritukset, jotka ovat saapuvan kansainvälisen opiskelijan suorittamia. Sisältää kaikki vaihto-opiskelijan opiskeluoikeuden aikana syntyneet opintopisteet.
  
  **Transferred**: Hyväksiluetut opintopisteet. Tilastointipäivämäärä on hyväksilukupäivämäärä, eli vaikka suoritus olisi vuodelta 2021, jos opintopiste hyväksiluetaan 2024, se lasketaan vuodelle 2024.

  Lisäksi painamalla "Show special categories" -valintaa, saat näkyviin myös harvinaisemmat kategoriat:
  
  **Separate**: Opintosuoritukset, joiden suorituksen luokittelu on "erillisellä opiskeluoikeudella" tai "opettajankoulutuksen erillisellä opiskeluikeudella" suoritettu. Ei sisällä kansainvälisten vaihto-opiskelijoiden suorituksia.

  **Other university**: Korkeakoulujen väliset yhteistyöopinnot: opintosuoritukset, jotka on tehty korkeakoulujen väliseen yhteistyösopimukseen perustuvalla opiskeluoikeudella.
  `,
  CreditsOfProgrammeCourses: `
  Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan.

  **Major credits**: Sisältää ne opintopisteet, joiden suorittajalla on suoritushetkellä ollut ensisijainen opinto-oikeus kyseiseen koulutusohjelmaan. Sisältää myös ohjelmaan siirtyneet ensisijaiset opiskelijat.

  **Non-major credits**: Sisältää koulutusohjelman tuottamat opintopisteet, joiden suorittajalla ei ole ollut suoritushetkellä ensisijaista opinto-oikeutta kyseiseen koulutusohjelmaan. Sisältää
  esimerkiksi vaihto-opiskelijat ja erillisopinto-oikeudella opiskelevat. Sisältää myös opintopisteet, jotka opiskelija on suorittanut koulutusohjelmaan ennen opintojen aloittamista koulutusohjelmassa tai opintojen päätyttyä.

  **Non-degree credits**: Opiskelijat, joilla ei ole tutkinto-oikeutta Helsingin yliopistossa.
    
  **Transferred credits**: Sisältää opintopisteet, jotka on suoritettu kyseisenä vuonna, ja hyväksiluettu tähän koulutusohjelmaan. Mukana ovat kaikenlaisilla opinto-oikeuksilla hyväksiluetut opintopisteet. **Luku ei sisälly total-sarakkeeseen**.

  **Type**: Kertoo onko kyseessä kurssi (course) vai opintokokonaisuus (module).
  `,
  StudentsOfProgrammeCourses: `
  Sisältää kurssien opiskelijat.

  **Not completed**: Sisältää opiskelijat, jotka ovat ilmoittautuneet kurssille, mutta eivät ole suorittaneet sitä ja opiskelijat, jotka ovat saaneet hylätyn arvosanan.

  **Major students**: Sisältää opiskelijat, joilla on ensisijainen opinto-oikeus kyseiseen koulutusohjelmaan.

  **Non-major students**: Sisältää kurssin opiskelijat, joilla EI ole ollut suoritushetkellä ensisijaista opinto-oikeutta kyseiseen koulutusohjelmaan. Sisältää
  esimerkiksi vaihto-opiskelijat ja erillis-opinto-oikeudella opiskelevat.

  **Transferred students**: Sisältää opiskelijat, jotka ovat suorittaneet kyseisenä vuonna hyväksiluettuja opintopisteitä tähän koulutusohjelmaan. Mukana ovat kaikenlaisilla opinto-oikeuksilla hyväksiluetut opintopisteet. Lukua **ei lasketa mukaan Total-sarakkeeseen**.

  **Type**: Kertoo onko kyseessä kurssi (course) vai opintokokonaisuus (module).
  `,
  GraduatedAndThesisWritersOfTheProgramme: `
  **Wrote thesis**: Sisältää kyseisenä vuonna kandidaatin- tai maisterintutkielman hyväksytysti suorittaneet opiskelijat. Mukana ei ole mahdollisia arvosanan korotuksia.

  **Graduated**: Sisältää kyseisenä vuonna valmistuneet opiskelijat riippumatta siitä, minä vuonna opiskeluoikeus ohjelmaan on myönnetty. Jaottelu on tehty valmistumispäivän perusteella.
  `,
  AverageGraduationTimes: `
  Yksittäinen palkki kertoo, kuinka moni opiskelija on valmistunut kyseisenä vuonna/lukuvuonna.

  Vihreä **vaakapalkki** kuvaa tavoiteajassa valmistuneita, keltainen 12 kuukauden sisällä tavoiteajasta valmistuneita ja punainen yli 12 kuukautta tavoiteajan ylittäneitä.

  **Breakdown**: Näyttää, kuinka moni kyseisenä kalenteri- tai lukuvuotena valmistuneista opiskelijoista valmistui tavoiteajassa, 12 kuukauden sisällä tavoiteajasta tai tätä myöhemmin.

  **Median time**: Näyttää kyseisenä kalenteri- tai lukuvuotena valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina. Vihreä **katkoviiva** kuvastaa tavoiteaikaa. Keltainen katkoviiva on tavoiteaika + 12 kuukautta.

  Valmistumisajoista on vähennetty lakisääteiset poissaolot.`,
  AverageGraduationTimesStudyTracks: `
  Yksittäinen palkki kertoo, kuinka moni kyseisenä **lukuvuotena ALOITTANEISTA** opiskelijoista on valmistunut.

  Vihreä **vaakapalkki** kuvaa tavoiteajassa valmistuneita, keltainen 12 kuukauden sisällä tavoiteajasta valmistuneita ja punainen yli 12 kuukautta tavoiteajan ylittäneitä.

  **Breakdown**: Näyttää, kuinka moni kyseisenä lukuvuotena aloittaneista, jo valmistuneista, opiskelijoista valmistui tavoiteajassa, 12 kuukauden sisällä tavoiteajasta tai tätä myöhemmin.

  **Median time**: Näyttää valmistuneiden opiskelijoiden opintojen keston **mediaanin** kuukausina sekä heidän prosentuaalisen osuutensa koko vuosikurssista. Vihreä **katkoviiva** kuvastaa tavoiteaikaa. Keltainen katkoviiva on tavoiteaika + 12 kuukautta.

  Valmistumisajoista on vähennetty lakisääteiset poissaolot.
  
  Jos sivun yläosassa on valittuna ”All study rights” (oletus), mukana ovat myös ohjelmaan siirtyneet ja ohjelmasta pois siirtyneet opiskelijat.`,
  ProgrammesBeforeOrAfter: `
  **Mikäli valittuna on kandiohjelma:** Sisältää maisteriohjelmat, joissa tämän kandiohjelman opiskelijat ovat aloittaneet valmistuttuaan kandeiksi. Vuosijaottelu on tehty maisteriohjelmassa aloittamisen perusteella.

  Mukana ovat **vain valmistuneet opiskelijat ja vain maisteriohjelmat.**

  **Mikäli valittuna on maisteriohjelma:** Sisältää kandiohjelmat, joissa tämän ohjelman opiskelijat ovat opiskelleet ennen tuloaan maisteriohjelmaan. Vuosijaottelu on tehty maisteriohjelmassa aloittamisen perusteella.
  `,
  StudyTrackOverview: `
  - **All**: Opiskelijat, joiden opiskeluoikeus on alkanut kyseisenä lukuvuonna. Opiskelijoiden, joiden opiskeluoikeuteen kuuluu sekä kandidaatin että maisterin tutkinnon suoritusoikeus, aloituspäivä maisteriohjelmassa on kandidaatin tutkinnon valmistumispäivän jälkeinen päivä.
  - **Started studying**: Opiskelijat, jotka ovat ilmoittautuneet läsnäolevaksi samana lukuvuonna kuin heidän opiskeluoikeutensa on alkanut. Opiskelija on voinut myöhemmin keskeyttää opintonsa tai siirtyä pois ohjelmasta.

  **Current status** kuvastaa opiskelijoiden tilannetta tällä hetkellä.
  - **Present**: Käynnissä olevalle lukukaudelle **läsnäolevaksi** ilmoittautuneet opiskelijat, jotka eivät ole valmistuneet koulutusohjelmasta
  - **Absent**: Käynnissä olevalle lukukaudelle **poissaolevaksi** ilmoittautuneet opiskelijat, jotka eivät ole valmistuneet koulutusohjelmasta
  - **Graduated**: Koulutusohjelmasta valmistuneet opiskelijat
  - **Inactive**: Opiskelijat, jotka eivät ole valmistuneet koulutusohjelmasta eivätkä ilmoittautuneet läsnä- tai poissaolevaksi käynnissä olevalle lukukaudelle

  Lukukausi-ilmoittautumisissa huomioidaan vain se opiskeluoikeus, joka liittyy tarkasteltavaan koulutusohjelmaan. Vaikka opiskelija olisi ilmoittautunut toiseen opiskeluoikeuteen läsnäolevaksi, mutta hän on laiminlyönyt ilmoittautumisen tarkasteltavaan koulutusohjelmaan liittyvään opiskeluoikeuteen, hänet lasketaan ryhmään ”Inactive”.

  Paksummilla pystyviivoilla eroteltujen kategorioiden (**Current status**, **Gender**, **Countries**) sarakkeet tuottavat yhteenlaskettuna kentän **All** arvon.

  Jos sivun yläosassa on valittuna ”All study rights” (oletus), mukana ovat myös ohjelmaan siirtyneet ja ohjelmasta pois siirtyneet opiskelijat.

  Yläosan valikosta on mahdollista valita tarkasteluun yhden opintosuunnan opiskelijat. Luvut kuvaavat tällöin kyseisen opintosuunnan opiskelijoita.
  `,
  StudyTrackProgress: `
  Kuvaa koulutusohjelmassa tiettynä lukuvuonna aloittaneiden opiskelijoiden etenemistä opintopisteissä mitattuna. Esimerkiksi kategoriaan 20–40 kuuluvat opiskelijat, jotka ovat suorittaneet **vähintään 20**, mutta **alle 40** opintopistettä.

  Opintopistekertymään on laskettu kaikki suoritukset, jotka opiskelija on suorittanut koulutusohjelmaan siirryttyään. Myös hyväksiluetut ja muuhun kuin valittuun koulutusohjelmaan tai opintosuuntaan tehdyt suoritukset lasketaan mukaan.

  Maisteriohjelmien tilastoissa opiskelijat jaetaan kahteen ryhmään: niihin, joilla on oikeus suorittaa sekä kandidaatin että maisterin tutkinto (**Bachelor + master study right**) ja niihin, joilla on oikeus suorittaa vain maisterin tutkinto (**Master study right**). *Bachelor + master study right* -tilastoissa aloitusvuosi on opiskelijan aloitusvuosi kandiohjelmassa, ja mukana ovat kaikki suoritukset, jotka opiskelija on suorittanut aloitettuaan kandiohjelmassa.

  Jos sivun yläosassa on valittuna ”All study rights” (oletus), mukana ovat myös ohjelmaan siirtyneet ja ohjelmasta pois siirtyneet opiskelijat.
  `,
  Name: `
  Pitkät kurssinimet on lyhennetty. Näet ne kokonaan laittamalla hiiren nimen yläpuolelle.
  `,
  NotCompleted: `
  Sisältää opiskelijat, jotka ovat ilmoittautuneet kurssille, mutta eivät ole suorittaneet sitä ja opiskelijat, jotka ovat saaneet hylätyn arvosanan.
  `,
}

studyProgrammeToolTips.StudyTrackOverviewCombinedProgramme = studyProgrammeToolTips.StudyTrackOverview.replace(
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

studyProgrammeToolTips.StudyTrackProgressEvaluationOverview = studyProgrammeToolTips.StudyTrackProgress.replace(
  'Jos sivun yläosassa on valittuna ”All study rights” (oletus), mukana ovat myös ohjelmaan siirtyneet ja ohjelmasta pois siirtyneet opiskelijat.',
  ''
)

studyProgrammeToolTips.AverageGraduationTimesStudyTracksMaster =
  studyProgrammeToolTips.AverageGraduationTimesStudyTracks.replace(
    'on valmistunut.',
    'on valmistunut.\n\n  Maisteriohjelmien tilastoissa opiskelijat on jaettu kahteen ryhmään:\n  - **Bachelor + master study right** -kaaviossa ovat mukana ne opiskelijat, joilla on oikeus suorittaa **sekä kandidaatin että maisterin** tutkinto. Tässä kaaviossa aloitusvuosi tarkoittaa opiskelijan aloitusvuotta kandiohjelmassa.\n  - **Master study right** -kaaviossa ovat mukana ne opiskelijat, joilla on oikeus suorittaa **ainoastaan maisterin** tutkinto.'
  )
