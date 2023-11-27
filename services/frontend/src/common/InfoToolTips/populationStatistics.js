export const populationStatisticsToolTips = {
  Advanced: `**Semesters:**  Jos haluaa tarkastella vain syyslukukaudella tai kevätlukukaudella aloittaneita, haluttu ajanjakso valitaan tästä.

  **Include:** Koulutusohjelmapopulaatiosta on oletusarvoisesti suodatettu pois ohjelmasta poissiirtyneet opiskelijat. Heidät voi sisällyttää mukaan lisäämällä ruksin ja noutamalla tulokset uudestaan (Fetch class with new settings).`,
  // Koulutusohjelmapopulaatiosta on oletusarvoisesti suodatettu pois vaihto-opiskelijat ja erillisopinto-oikeudella opiskelevat. Näitä ryhmiä voi sisällyttää mukaan lisäämällä ruksin haluamaansa kohtaan.
  QueryCard: `**Valitun koulutusohjelmavuosikurssin perustiedot.**
  
  **Sample size** luku sisältää läsnä- ja poissaolevaksi ilmoittautuneet opiskelijat, muttei "excludes"-ryhmiä, jotka voi määritellä "advanced settings" -kohdasta.
  
  **Fall** = 1.8. - 31.12. ilmoittautuneet ja **Spring** = 1.1. - 31.7. ilmoittautuneet.
  
  **Showing XX months**: Dataa näytetään ohjelman vuosikurssin alkamispäivästä lähtien haluttuun kuukauteen asti (oletusarvoisesti "tähän päivään").
  
  **Updated** kertoo milloin data on päivitetty.`,
  CreditAccumulation: `**Credit Accumulation**
  
  Opiskelijoiden kumulatiiviset opintopistekertymät opiskelijakohtaisina kuvaajina.
  Kun hiiren vie kuvaajien päälle, saa näkyviin jokaista kuvaajaa vastaavan opiskelijanumeron.
  Opiskelijanumeron yhteydessä olevaa ympyrää klikkaamalla siirtyy ”student statistics” puolelle ja näkee valitun opiskelijan opintotiedot.
  Timantin muotoinen ikoni kertoo opiskelijan valmistuneen valitusta koulutusohjelmasta kyseisellä hetkellä.

  X-akselin skaalaa voi säätää harmaista painikkeista ”1m”, ”3m”, ”6m”, ”YTD”, ”1y” ja ”ALL” tai kuvaajan alla olevan sinisen näkymän harmaita ”kahvoja” siirtämällä.
  Y-akselin skaalaa voi säätää harmaista painikkeista ”small” ”medium” ja "large”`,
  CreditStatistics: `
  **Credits gained**

  Taulukko kertoo opintopistekertymän valitulle opiskelijapopulaatiolle. Opintopisteluokat on suhteutettu tarkasteltavan populaation aloitusvuoteen. 
  Ylin luokka kertoo siksi aina tavoiteajassa etenevien määrän ja suhteellisen osuuden. 

  Opintopisteet sisältävät opiskelijoiden **kaikki opintopisteet**, eli siis myös ennen valitun tutkinnon alkamista suoritetut opinnot.

  Huom! Nollasuorittajissa on mukana myös poissaolevaksi ilmoittautuneet, ellei heitä ole erikseen suodatettu populaatiosta pois.

  Kategorioita voi myös itsessään käyttää suodattimina. Klikkaamalla rivin vasemmassa reunassa olevaa suodatinta jäävät näkyviin vain sen kategorian opiskelijat.
  Suodatin aukeaa samalla ikkunan vasempaan laitaan, josta sitä voi käyttää vapaavalintaisilla arvoilla.
  
  **Credit statistics**

  Taulukko kertoo kaikkien tarkasteluun valittujen opiskelijoiden opintopistemääristä tähän päivään mennessä. Statistiikka on suodatettu käytettyjen filttereiden mukaan.
  Esimerkiksi, jos mukaan on valittu vain naisopiskelijat, statistiikat koskevat vain heitä. 
  
  + **Total** on kokonaisopintopistemäärä kyseiselle populaatiolle.
  + **Mean** kuvaa opintopistemäärän opiskelijakohtaista keskiarvoa.
  + **Keskihajonta** kuvaa vaihtelua opintopistemäärissä. Karkeasti, mitä suurempi keskihajonta, sitä enemmän opintopistemäärissä on vaihtelua opiskelijoiden kesken.
  + **Min ja Max** kertovat pienimmän ja suurimman opintopistemäärän, jotka jollain opiskelijoilla kyseisessä populaatiossa on.

  Mikäli valintatapatieto kyseiselle populaatiolle on saatavissa, näytetään myös samat statistiikat per valintatapa.  

  **Distribution Development**

  Pylväsdiagrammi kertoo opiskelijoiden jakauman opintopistehaarukoihin kalenterivuosittain, lukuvuosittain tai lukukausittain eriteltynä. Valmistuneita opiskelijoita ei sisällytetä valmistumisen jälkeisiin pylväisiin.

  **Cumulative**-valinnan ollessa käytössä kunkin opiskelijan kaikki aiemmat opintopisteet lasketaan mukaan opintopistemäärään. Muutoin vain pylvästä vastaavalla aikavälillä kirjatut opintopisteet otetaan huomioon.
  `,
  CoursesOfClass: `**Courses of class**

  Tämä taulukko sisältää näkyvissä olevien opiskelijoiden kaikki kurssisuoritukset.
  
  Opiskelijat on mahdollista suodattaa kurssin perusteella käyttämällä kurssirivin vasemmassa laidassa olevaa suodatinpainiketta.
  Kurssisuodatin aukeaa ikkunan vasempaan laitaan ja tarjoaa lisää vaihtoehtoja suodatukseen. Voit myös valita monta kurssia kerralla suodattimeen.
  
  Klikkaamalla kurssin nimen vieressä olevaa sinistä nuolta, siirryt ko. kurssin **Course Statistics** -näkymään.

  Lisäksi kurssin nimi **name** ja koodisarakkeissa **code** suodatinkuvaketta  klikkaamalla tulee esiin hakukentät suodattamista varten.
  Suodattimet saa tyhjennettyä painamalla kentän vieressä olevaa ruksia tai valitsemall valikon alaosasta **Reset column filter**.

  **Huom! Nämä suodattimet vaikuttavat vain tähän taulukkoon, eivät koko populatioon.**
  
  **Taulukot**
  - **pass/fail** - näkymä sisältää kurssisuoritukset, hylätyt, yritykset sekä ilmoittautumistiedot. Huom.! ilmoittautumistiedot ovat saatavilla vain Sisun käyttöönoton jälkeiseltä ajalta.
    - **Total students** - sarake näyttää kaikkien opiskelijoiden määrän, mukaanlukien ilmoittautuneet ilman arvosanaa.
    - **Enrolled, no grade** - sarake näyttää niiden opiskelijoiden määrän, joilla on ilmoittautuminen muttei arvosanaa eikä hylättyä suoritusta.
  - **grades** - arvosanajakauma.
  - **when passed** - kurssisuorituksen ajankohta. Huom.! *Passed*-sarakkeen kokonaissumma ei välttämättä täsmää puolivuosittaisten lukumäärien summan kanssa johtuen tuplakirjauksista Oodissa.
  - **students** - opiskelijan arvosanat kursseittain.
  `,
  CoursesOfPopulation: `**Courses of Population**

  Tämä taulukko sisältää näkyvissä olevien opiskelijoiden kaikki kurssisuoritukset.
  
  Opiskelijat on mahdollista suodattaa kurssin perusteella käyttämällä kurssirivin vasemmassa laidassa olevaa suodatinpainiketta.
  Kurssisuodatin aukeaa ikkunan vasempaan laitaan ja tarjoaa lisää vaihtoehtoja suodatukseen. Voit myös valita monta kurssia kerralla suodattimeen.
  
  Klikkaamalla kurssin nimen vieressä olevaa sinistä nuolta, siirryt ko. kurssin **Course Statistics** -näkymään.
  
  Taulukon tietoja voi suodattaa antamalla opiskelijoiden vähimmäismäärän kurssilla kenttään *Limit to courses where student number at least*.
  Lisäksi kurssin nimi **name** ja koodisarakkeissa **code** suodatinkuvaketta  klikkaamalla tulee esiin hakukentät suodattamista varten.
  Suodattimet saa tyhjennettyä painamalla kentän vieressä olevaa ruksia tai valitsemall valikon alaosasta **Reset column filter**.
  
  **Huom! Nämä suodattimet vaikuttavat vain tähän taulukkoon, eivät koko populatioon.**
  
  **Taulukot**
  - **pass/fail** - näkymä sisältää kurssisuoritukset, hylätyt, yritykset sekä ilmoittautumistiedot. Huom.! ilmoittautumistiedot ovat saatavilla vain Sisun käyttöönoton jälkeiseltä ajalta.
  - **grades** - arvosanajakauma.
  `,
  Search: `Tässä osiossa voi tarkastella koulutusohjelmakohtaisia populaatioita sisäänotto-lukuvuoden mukaisesti,
  vuosikurssi kerrallaan. Uudet koulutusohjelmat ovat pääsääntöisesti alkaneet 1.8.2017,
  joten oletusvalinnat näyttävät tiedot tästä päivämäärästä lähtien.

  - **Class of:** lukuvuosi, jolloin opiskelija on ilmoittautunut ensimmäisen kerran (läsnä- tai poissaolevaksi) ohjelmaan. Ilmoittautumisen opinto-oikeus voi olla ensi- tai toissijainen.
  - **Study programme:** haluttu koulutusohjelma.
  - **Select tag (Optional):** itsetehty tai valmis tägi.
  - **Study track (Optional):** opintosuunta.`,
  TagAndTrackMovedIntoFilters: `
  Tägien ja opintosuuntien valinnat ovat siirtyneet tästä omiksi filtereikseen.
  Voit tehdä valinnat siirryttyäsi tarkastelemaan ohjelman tilastoja.
  `,
  StudentsGuidanceGroups: `**Students**

  Taulukko näyttää oletusarvoisesti vain opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden nimet.
  
  Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan "student statistic" -näkymään.
  
  Klikkaamalla "Sisu"-nuolta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä.

  **General**
  
  Valikoituja selvennyksiä: 
  - **Credits**
    - **All**  listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson  ajalta.
    - **Since ... ** listaa opiskelijan suoritetut opintopisteet määritellystä ajankohdasta alkaen
  - **Start of studyright**: Opiskelijan valittuun ohjelmaan liittyvän opinto-oikeuden alkupäivä
  - **Study programme**: Näyttää opiskelijan uusimman opinto-oikeuden. Opiskelijan kaikki opinto-oikeudet näkyvät uusimmasta vanhimpaan Excel-tiedostossa, sekä laittamalla hiiri solun päälle.
  - **Other programme**: Näkyy, jos ryhmälle on asetettu opinto-oikeus. Tämä korvaa Study programme -sarakkeen, ja toimii muuten samoin mutta näyttää opiskelijan muista opinto-oikeuksista uusimman.
  - **Started in programme**: Opiskelijan valitussa ohjelmassa aloituspäivämäärä. Kandi+maisteriopiskelijoille kandiksi valmistumispäivämäärä +1.
  `,
  StudentsClass: `**Students**

  Taulukko näyttää oletusarvoisesti vain opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden nimet.
  
  Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan "student statistic" -näkymään.
  
  Klikkaamalla "Sisu"-nuolta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä.

  **General**
  
  Valikoituja selvennyksiä: 
  - **Credits**
    - **All**  listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson  ajalta
    - **HOPS** listaa opiskelijan kaikki HOPSiin sijoitut opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)
    - **Since start in programme** listaa opiskelijan ohjelmassa aloittamisen jälkeen suoritut opintopisteet
  - **Transferred from:** opiskelijan vanha koulutusohjelma, josta opiskelija on siirtynyt uuteen.
  - **Start of studyright**: Opiskelijan valittuun ohjelmaan liittyvän opinto-oikeuden alkupäivä
  - **Started in programme**: Opiskelijan ko. ohjelmassa aloituspäivämäärä. Kandi+maisteriopiskelijoille kandiksi valmistumispäivämäärä +1
  - **Semesters present**: Näyttää opiskelijan ilmoittautumiset lukukausittain. Laita hiiri solun yläpuolelle nähdäksesi tekstimuotoisen selityksen ilmoittautumisista.
    - Värikoodit:
      - Vihreä = Läsnäoleva
      - Keltainen = Ilmoittautunut poissaolevaksi
      - Punainen = Ei ilmoittautumista, mutta opiskelijalla on ollut opinto-oikeus
      - Harmaa = Opiskelijalla ei ollut tällöin opinto-oikeutta
      - Kruunu kertoo opiskelijan valmistuneen kyseisenä lukukautena. Jos näkymässä on yhdistettynä alempi ja ylempi tutkinto, ylemmän valmistumisen kruunussa on timantti.
    - Excel-versiossa sarakkeessa näkyy tieto opiskelijan ensimmäisestä ilmoittautumisesta, jonka jälkeen ilmoittautumiset esitettynä symbolein:
      - \\+ = Ilmoittautunut läsnäolevaksi
      - o = Ilmoittautunut poissaolevaksi
      - _ = Ei ilmoittautumista

  **Courses**
  
  Tällä välilehdellä näkyy, mitä pakollisiksi määriteltyjä kursseja opiskelija on suorittanut.

  
  **Tags**
  
  Opiskelijoille voi luoda tag:eja ryhmittelyä varten kohdassa "Study Program" > "Overview" > haluttu koulutusohjelma.

  **Progress**

  Tämä näkymä on tällä hetkellä käytössä vain kandivaiheen opinto-ohjelmissa.
  Tällä välilehdellä näkyy opintojen kehitys annettujen kriteerien mukaan akateemista vuotta kohti. Kurssi merkataan tehdyksi, jos sillä on suoritusmerkintä tai hyväksiluku 
  minä tahansa lukuvuonna. Opintopistekriteerin täyttämiseen vaaditaan, että opintopisteet on suoritettu kyseisen akateemisen vuoden aikana.


  **Huomaa**, että klikkaamalla taulukon yläreunassa olevaa kolme pistettä sisältävää kuvaketta, voit ladata itsellesi Excel tiedoston. Tiedosto sisältää lisäksi muita sarakkeita, kuten läsnäolon lukukausittain sekä yhteystiedot.
  
  ***Yhteystietojen käyttö on kuitenkin sallittua vain opintoneuvontaan liittyvissä asiossa.*** 
  
  `,
  StudentsCustom: `**Students**

  Taulukko näyttää oletusarvoisesti vain opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden nimet.
  
  Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan "student statistic" -näkymään.
  
  Klikkaamalla "Sisu"-nuolta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä.
  
  **All credits** listaa opiskelijan kaikki opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)


  **Programme**-sarake näyttää opiskelijan uusimman opinto-oikeuden. Jos opiskelijalla on opinto-oikeuksia muihinkin koulutusohjelmiin, ne näkyvät aikajärjestyksessä uusimmasta vanhimpaan Excel-tiedostossa, sekä laittamalla hiiri koulutusohjelman päälle.

  `,
  Filters: {
    Add: `Harmaata ”add” painiketta klikkaamalla aukeaa filters- eli suodatinvalikko, 
    josta voi lisätä haluamiaan suodattimia, jotka rajaavat valittua populaatiota.`,
    Filters: `Valitut suodattimet näkyvät tässä. Suodattimia voi poistaa klikkaamalla mustaa rastia.
    <br> <br>
    **Show excluded students only**: Tällä liukukytkimellä voi valita suodatuksien komplementin,
    eli liukukytkin päällä saa näkyviin poissuodatetut opiskelijat.
    <br> <br>
    **Clear all filters**: Poistaa kerralla valitut filtterit.
    <br> <br>
    **Save filters as preset**: Voit tallentaa tekemäsi filtteri-yhdistelmän myöhempää käyttöä varten.`,
    CreditsAtLeast: 'Suodattaa pois opiskelijat, joilla on alle annetun määrän opintopisteitä',
    CreditsLessThan: 'Suodattaa pois opiskelijat, joilla on yli annetun määrän opintopisteitä',
    GradeMeanFilter: 'Suodattaa pois opiskelijat, joilla on yli/alle annetun numeron keskiarvo',
    CreditsLessThanFromMandatory: `Suodattaa pois opiskelijat, joilla on yli
    annetun määrän opintopisteitä pakollisista kursseista`,
    StartingThisSemester: 'Suodattaa opiskelijat, jotka aloittivat opiskelun valittuna lukuvuonna tai sitä ennen',
    EnrollmentStatus: 'Näyttää opiskelijat, jotka olivat läsnä- tai poissaolevana valittuina lukukausina',
    CanceledStudyright: 'Suodattaa opiskelijat, jotka ovat/eivät ole ilmoittautuneet läsnä- tai poissaoleviksi',
    ExtentGraduated: 'Suodattaa opiskelijat, jotka ovat/eivät ole valmistuneet.',
    TransferFilter: `Voit valita opiskelijat, jotka ovat vaihtaneet annetusta koulutusohjelmasta toiseen.
      Vaihtaminen tarkoittaa sitä, kun opiskelija vaihtaa koulutusohjelmaansa kesken opinto-oikeutensa.
      (eikä opiskelijaa joka saa opinto-oikeuden joltakin toiselta instituutiolta)`,
    PriorityStudyright: 'placeholder',
    TransferToStudyrightFilter: 'Suodattaa pois opiskelijat jotka eivät ole vaihtaneet kyseiseen ohjelmaan',
    TagFilter: "Suodattaa opiskelijat jotka ovat/eivät ole merkitty valitulla 'tagilla'",
    CourseCreditFilter: 'Suodattaa pois opikelijat joilla enemmän tai vähemmän opintopisteitä kurssista',
    GradeFilter: 'Suodattaa pois opiskelijat joilla muu arvosana',
    ProgrammeFilter: 'Suodattaa pois opiskelijat jotka eivät ole valitussa ohjelmassa',
    CreditsBeforeStudyright:
      'Suodattaa pois opiskelijat joilla vähemmän opintopisteitä ennen kyseisessä ohjelmassa aloittamista',
    StudytrackFilter: 'Palauttaa opiskelijat joilla on valittu kyseinen suuntautumisvaihtoehto',
  },
  ProgrammeDistributionCustomPopulation: 'Näyttää opiskelijan viimeisimmän koulutusohjelman',
  ProgrammeDistributionCoursePopulation: 'Näyttää sen koulutusohjelman, jossa opiskelija oli suorittaessaan kurssin',
  GradeDistributionCoursePopulation: 'Näyttää korkeimman arvosanan, jonka opiskelija on saanut valitulla aikavälillä.',
  CreditDistributionCoursePopulation: 'Näyttää tiedekunta-/ohjelmankohtaisen opintopistejakauman.',
  LanguageDistributionCoursePopulation: 'Näyttää kielijakauman kurssin suorituskielistä.',
}
