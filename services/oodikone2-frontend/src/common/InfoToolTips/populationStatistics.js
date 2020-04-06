export default {
  Main: `Tässä osiossa voi tarkastella koulutusohjelmakohtaisia populaatioita
  sisäänotto-lukuvuoden mukaisesti, vuosikurssi kerrallaan. Uudet koulutusohjelmat
  ovat pääsääntöisesti alkaneet 1.8.2017 joten oletusvalinnat näyttävät tiedot tästä päivämäärästä lähtien.
  <br>
  <br>
  **Class of:** lukuvuosi, jolloin opiskelija on ilmoittautunut ensimmäisen kerran (läsnä- tai poissaolevaksi) ohjelmaan. Ilmoittautumisen opinto-oikeus voi olla ensi- tai toissijainen. <br>
  **Study programme:** haluttu koulutusohjelma.<br>
  **Select tag (Optional):** itsetehty tai valmis tägi.<br>
  **Study track (Optional):** opintosuunta.<br>
  **Degree (optional):** tutkintotaso.`,
  Advanced: `**Semesters:**  Jos haluaa tarkastella vain syyslukukaudella tai kevätlukukaudella ilmoittautuneita, haluttu ajanjakso valitaan tästä.

  **Include:** Koulutusohjelmapopulaatiosta on oletusarvoisesti suodatettu pois vaihto-opiskelijat, tutkinnonsuoritusoikeudesta luopuneet ja erillisopinto-oikeudella opiskelevat. Näitä ryhmiä voi sisällyttää mukaan lisäämällä ruksin haluamaansa kohtaan.`,
  QueryCard: `Valitun koulutusohjelmavuosikurssin perustiedot.
  <br>
  <br>
  **Sample size** luku sisältää läsnä- ja poissaolevaksi ilmoittautuneet opiskelijat, muttei "excludes"-ryhmiä, jotka voi määritellä "advanced settings" -kohdasta.
  <br>
  **Fall** = 1.8. - 31.12. ilmoittautuneet ja **Spring** = 1.1. - 31.7. ilmoittautuneet.
  <br>
  **showing XX months**: Dataa näytetään ohjelman vuosikurssin alkamispäivästä lähtien haluttuun kuukauteen asti (oletusarvoisesti "tähän päivään").
  <br>
  **Updated** kertoo milloin data on päivitetty
  <br>
  Mustasta rastista voi sulkea valitun koulutusohjelmavuosikurssin.
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
    StartingThisSemester: `Suodattaa opiskelijat, jotka aloittivat opiskelun valittuna lukuvuonna tai sitä ennen`,
    EnrollmentStatus: 'Näyttää opiskelijat, jotka olivat läsnä- tai poissaolevana valittuina lukukausina',
    CanceledStudyright: `Suodattaa opiskelijat, jotka ovat/eivät ole ilmoittautuneet läsnä- tai poissaoleviksi`,
    DisciplineTypes: `Asettaa annetun tyyppisille annettujen tieteenalojen
    kursseille automaattisesti osallistumissuodattimet.
    Voit asettaa rajan osallistumismäärälle tuodaksesi esiin vain suositut kurssit`,
    ExtentGraduated: `Suodattaa opiskelijat, jotka ovat/eivät ole valmistuneet.`,
    TransferFilter: `Voit valita opiskelijat, jotka ovat vaihtaneet annetusta koulutusohjelmasta toiseen.
      Vaihtaminen tarkoittaa sitä, kun opiskelija vaihtaa koulutusohjelmaansa kesken opinto-oikeutensa.
      (eikä opiskelijaa joka saa opinto-oikeuden joltakin toiselta instituutiolta)`,
    PriorityStudyright: `placeholder`,
    TransferToStudyrightFilter: `Suodattaa pois opiskelijat jotka eivät ole vaihtaneet kyseiseen ohjelmaan`,
    TagFilter: `Suodattaa opiskelijat jotka ovat/eivät ole merkitty valitulla 'tagilla'`,
    CourseCreditFilter: `Suodattaa pois opikelijat joilla enemmän tai vähemmän opintopisteitä kurssista`,
    GradeFilter: `Suodattaa pois opiskelijat joilla muu arvosana`,
    ProgrammeFilter: `Suodattaa pois opiskelijat jotka eivät ole valitussa ohjelmassa`,
    CreditsBeforeStudyright: `Suodattaa pois opiskelijat joilla vähemmän opintopisteitä ennen kyseisessä ohjelmassa aloittamista`,
    StudytrackFilter: `Palauttaa opiskelijat joilla on valittu kyseinen suuntautumisvaihtoehto`
  },
  CreditAccumulationGraph: {
    AccordionTitle: ` **Credit accumulation graph**
    Opiskelijoiden kumulatiiviset opintopistekertymät opiskelijakohtaisina kuvaajina.`,
    Infobox: `Opiskelijoiden kumulatiiviset opintopistekertymät opiskelijakohtaisina kuvaajina. Kun
    hiiren vie kuvaajien päälle, saa näkyviin jokaista kuvaajaa vastaavan opiskelijanumeron. Opiskelijanumeron
    yhteydessä olevaa ympyrää klikkaamalla siirtyy ”student statistics” puolelle ja näkee valitun opiskelijan
    opintotiedot.
    <br>
    X-akselin skaalaa voi säätää harmaista painikkeista ”1m”, ”3m”, ”6m”, ”YTD”, ”1y” ja ”ALL” tai kuvaajan alla
    olevan sinisen näkymän harmaita ”kahvoja” siirtämällä. Y-akselin skaalaa voi säätää harmaista painikkeista
    ”small” ”medium” ja "large”`
  },
  CoursesOf: {
    AccordionTitle: `**Courses of population**
    <br> <br>
    Tämä taulukko sisältää kaikkien populaatioon liittyvien opiskelijoiden kaikki kurssisuoritukset.`,
    Infobox: `Courses of population
    <br> <br>
    Tämä taulukko sisältää kaikkien populaatioon liittyvien opiskelijoiden kaikki kurssisuoritukset.
    <br> <br>
    Kurssin nimiää voi käyttää suodattimina, eli klikkaamalla haluamiansa nimiä saa vain näkyviin kyseisten kurssien opiskelijat. Nämä suodatimet löytyvät ”Filters” otsikon alta ja ne voi poistaa klikkaamalla mustaa rastia.
    <br> <br>
    Klikkaamalla kurssin nimen vieressä olevaa sinistä nuolta siirtyy ”course statistics” 
    näkymään valitun kurssin osalta.
    <br> <br>
    Taulukon tietoja voi suodattaa kohdassa ”limit to courses where student number at least” 
    kirjoittamalla haluamansa opiskelijalukumäärän kenttään sekä kohdassa ”code (filter here)” 
    kirjoittamalla haluamansa kurssikoodin alun kenttään ja näkyviin jää esimerkiksi vain 
    ”MAT”-alkuiset kurssit. Huom.! Nämä suodattimet ovat ”taulukon sisäisiä” suodattimia, 
    eivätkä siis ilmesty ”Filters” otsikon alle. Suodattimet saa pois tyhjentämällä kentän 
    kirjoittamistaan merkeistä ja painamalla ENTER.
    <br> <br>
    Taulukossa on kolme eri näkymää ”pass/fail”, ”grades” ja ”when passed”.
    <br> <br>
    **pass/fail** oletusnäkymä, joka sisältää kurssisuoritukset, hylätyt sekä yritykset. 
    Taulukon tietoja voi järjestää eri sarakkeita (n, after retry, percentage, many times, 
    per student, passed ja attempted) klikkaamalla.
    <br> <br>
    **grades** arvosanajakauma
    <br> <br>
    **when passed** kurssisuorituksen ajankohdan. Huom.! ”passed” sarakkeen kokonaissumma ei välttämättä 
    täsmää puolivuosi-lukumäärien summan kanssa, johtuen tuplakirjauksista Oodissa.`
  },
  Students: {
    AccordionTitle: `**Students:** Taulukko näyttää oletusarvoisesti vain 
    opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden nimet.`,
    Infobox: `**Students:** harmaata "show" painiketta klikkaamalla saa listan kaikista populaation opiskelijoista
    (huom. suodattimet vaikuttavat tähän listaan!). Taulukko näyttää oletusarvoisesti vain 
    opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden nimet.
    <br> <br>
    **GENERAL:**
    Klikkaamalla opiskelijanumeron vieressä olevaa sinistä nuolta, siirtyy "student statistic" näkymään valitun opiskelijan osalta.
    <br> <br>
    **credits since start of studyright**  listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson / populaation ajalta.
    <br> <br>
    **all credits:** listaa opiskelijan kaikki opintopisteet (myös aiemmat suoritukset, 
      eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)
    <br> <br>    
    **transferred from:** opiskelijan vanha koulutusohjelma, josta opiskelija on siirtynyt uuteen.
    <br> <br>
    **studytracks:** opintosuunta
    <br> <br>
    **MANDATORY COURSES:**
    Tällä välilehdellä näkyy, mitä pakollisiksi määriteltyjä kursseja opiskelija on suorittanut. 
    Kurssit voi määrittää kohdassa "Study program" > "Overview" > haluttu koulutusohjelma. 
    Scrollatessa kurssitaulukkoa alaspäin, kurssin nimen saa näkyviin viemällä kursorin halutun 
    solun kohdalle.
    <br> <br>
    **Tags:**
    <br>
    Opiskelijoille voi luoda tag:eja ryhmittelyä varten kohdassa "Study Program" > "Overview" > haluttu koulutusohjelma.
    <br> <br>
    **Download**:  klikkaamalla tätä harmaata kuvaketta, saa ladattua .xlsx tiedoston, 
    joka sisältää kaikki "General" ja "Mandatory Courses" välilehtien tiedot.
    `
  },
  CreditStatistics: {
    AccordionTitle: `**Credit Statistics** Opintopistekertymä-kategoria skaalautuvat valitun tarkastelujakson mukaan. `,
    Infobox: `Opintopistekertymä-kategoria skaalautuvat valitun tarkastelujakson mukaan. 
    Jos tarkastelujaksoksi valitsee 12 kuukautta, ylin kategoria on 55 opintopistettä tai yli, 
    eli opiskelija etenee tavoiteajassa. Taulukosta näkee silmäyksellä tavoiteajassa etenevät (ylin kategoria) 
    ja myös esim. nollasuorittajat. Huom.! nollasuorittajissa on mukana myös poissaolevaksi ilmoittautuneet, 
    ellei heitä ole erikseen suodattanut populaatiosta pois. Kategorioita voi myös itsessään käyttää suodattimina, 
    eli klikkaamalla haluamaansa kategoriaa saa näkyviin vain sen kategorian opiskelijat. 
    Tämä suodatin löytyy ”Filters” otsikon alta ja sen voi poistaa klikkaamalla mustaa rastia.`
  },
  ProgrammeDistributionCustomPopulation: `Näyttää opiskelijan viimeisimmän koulutusohjelman`,
  ProgrammeDistributionCoursePopulation: `Näyttää sen koulutusohjelman, jossa opiskelija oli suorittaessaan kurssin`,
  GradeDistributionCoursePopulation: `Näyttää korkeimman arvosanan, jonka opiskelija on saanut valitulla aikavälillä.`,
  CreditDistributionCoursePopulation: `Näyttää tiedekunta-/ohjelmankohtaisen opintopistejakauman.`
}
