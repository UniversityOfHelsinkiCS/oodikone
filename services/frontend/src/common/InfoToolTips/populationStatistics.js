export default {
  Advanced: `**Semesters:**  Jos haluaa tarkastella vain syyslukukaudella tai kevätlukukaudella ilmoittautuneita, haluttu ajanjakso valitaan tästä.

  **Include:** Koulutusohjelmapopulaatiosta on oletusarvoisesti suodatettu pois vaihto-opiskelijat, tutkinnonsuoritusoikeudesta luopuneet ja erillisopinto-oikeudella opiskelevat. Näitä ryhmiä voi sisällyttää mukaan lisäämällä ruksin haluamaansa kohtaan.`,
  QueryCard: `**Valitun koulutusohjelmavuosikurssin perustiedot.**
  
  **Sample size** luku sisältää läsnä- ja poissaolevaksi ilmoittautuneet opiskelijat, muttei "excludes"-ryhmiä, jotka voi määritellä "advanced settings" -kohdasta.
  
  **Fall** = 1.8. - 31.12. ilmoittautuneet ja **Spring** = 1.1. - 31.7. ilmoittautuneet.
  
  **Showing XX months**: Dataa näytetään ohjelman vuosikurssin alkamispäivästä lähtien haluttuun kuukauteen asti (oletusarvoisesti "tähän päivään").
  
  **Updated** kertoo milloin data on päivitetty.`,
  CreditAccumulation: `**Credit Accumulation**
  
  Opiskelijoiden kumulatiiviset opintopistekertymät opiskelijakohtaisina kuvaajina.
  Kun hiiren vie kuvaajien päälle, saa näkyviin jokaista kuvaajaa vastaavan opiskelijanumeron.
  Opiskelijanumeron yhteydessä olevaa ympyrää klikkaamalla siirtyy ”student statistics” puolelle ja näkee valitun opiskelijan opintotiedot.

  X-akselin skaalaa voi säätää harmaista painikkeista ”1m”, ”3m”, ”6m”, ”YTD”, ”1y” ja ”ALL” tai kuvaajan alla olevan sinisen näkymän harmaita ”kahvoja” siirtämällä.
  Y-akselin skaalaa voi säätää harmaista painikkeista ”small” ”medium” ja "large”`,
  CreditStatistics: `**Opintopistekertymä**
  
  Taulukon rivit skaalautuvat valitun tarkastelujakson mukaan.
  Jos tarkastelujaksoksi valitsee 12 kuukautta, on ylin kategoria 55 opintopistettä tai yli, eli opiskelija etenee tavoiteajassa.
  Taulukosta näkee silmäyksellä tavoiteajassa etenevät (ylin kategoria) ja esim. nollasuorittajat.
  
  **Huom! nollasuorittajissa on mukana myös poissaolevaksi ilmoittautuneet, ellei heitä ole erikseen suodatettu populaatiosta pois.**
  
  Kategorioita voi myös itsessään käyttää suodattimina. Klikkaamalla rivin vasemmassa reunassa olevaa suodatinta jäävät näkyviin vain sen kategorian opiskelijat.
  Suodatin aukeaa samalla ikkunan vasempaan laitaan, josta sitä voi käyttää vapaavalintaisilla arvoilla.
  `,
  CoursesOfPopulation: `**Courses of population**

  Tämä taulukko sisältää näkyvissä olevien opiskelijoiden kaikki kurssisuoritukset.
  
  Opiskelijat on mahdollista suodattaa kurssin perusteella käyttämällä kurssirivin vasemmassa laidassa olevaa suodatinpainiketta.
  Kurssisuodatin aukeaa ikkunan vasempaan laitaan ja tarjoaa lisää vaihtoehtoja suodatukseen. Voit myös valita monta kurssia kerralla suodattimeen.
  
  Klikkaamalla kurssin nimen vieressä olevaa sinistä nuolta, siirryt ko. kurssin *Course Statistics* -näkymään.
  
  Taulukon tietoja voi suodattaa antamalla opiskelijoiden vähimmäismäärän kurssilla kenttään *Limit to courses where student number at least*.
  Lisäksi kurssin nimi- ja koodisarakkeissa on hakukentät *("filter here")* suodattamista varten.
  Suodattimet saa tyhjennettyä painamalla kentän vieressä olevaa ruksia.
  
  **Huom! Nämä suodattimet vaikuttavat vain tähän taulukkoon, eivät koko populatioon.**
  
  **Taulukot**
  
  - **pass/fail** - oletusnäkymä, joka sisältää kurssisuoritukset, hylätyt sekä yritykset. Taulukon tiedot voi järjestää sarakkeita (n, after retry, percentage, many times, per student, passed ja attempted) klikkaamalla.
  - **grades** - arvosanajakauma.
  - **when passed** - kurssisuorituksen ajankohta. Huom.! *Passed*-sarakkeen kokonaissumma ei välttämättä täsmää puolivuosittaisten lukumäärien summan kanssa johtuen tuplakirjauksista Oodissa.
  `,
  Search: `Tässä osiossa voi tarkastella koulutusohjelmakohtaisia populaatioita sisäänotto-lukuvuoden mukaisesti,
  vuosikurssi kerrallaan. Uudet koulutusohjelmat ovat pääsääntöisesti alkaneet 1.8.2017,
  joten oletusvalinnat näyttävät tiedot tästä päivämäärästä lähtien.

  - **Class of:** lukuvuosi, jolloin opiskelija on ilmoittautunut ensimmäisen kerran (läsnä- tai poissaolevaksi) ohjelmaan. Ilmoittautumisen opinto-oikeus voi olla ensi- tai toissijainen.
  - **Study programme:** haluttu koulutusohjelma.
  - **Select tag (Optional):** itsetehty tai valmis tägi.
  - **Study track (Optional):** opintosuunta.`,
  Students: `**Students**

  Taulukko näyttää oletusarvoisesti vain opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden nimet.
  
  **General**
  
  Klikkaamalla opiskelijanumeron vieressä olevaa sinistä nuolta, siirtyy "student statistic" näkymään valitun opiskelijan osalta.
  
  - **credits since start of studyright:**  listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson / populaation ajalta.
  - **all credits:** listaa opiskelijan kaikki opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)
  - **transferred from:** opiskelijan vanha koulutusohjelma, josta opiskelija on siirtynyt uuteen.
  - **studytracks:** opintosuunta
  
  **Mandatory Courses**
  
  Tällä välilehdellä näkyy, mitä pakollisiksi määriteltyjä kursseja opiskelija on suorittanut.
  Kurssit voi määrittää kohdassa "Study program" > "Overview" > haluttu koulutusohjelma. Scrollatessa kurssitaulukkoa alaspäin, kurssin nimen saa näkyviin viemällä kursorin halutun solun kohdalle.
  
  **Tags**
  
  Opiskelijoille voi luoda tag:eja ryhmittelyä varten kohdassa "Study Program" > "Overview" > haluttu koulutusohjelma.
  
  **Download**
  
  Klikkaamalla tätä harmaata kuvaketta, saa ladattua .xlsx tiedoston, joka sisältää kaikki "General" ja "Mandatory Courses" välilehtien tiedot.
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
    StudytrackFilter: `Palauttaa opiskelijat joilla on valittu kyseinen suuntautumisvaihtoehto`,
  },
  ProgrammeDistributionCustomPopulation: `Näyttää opiskelijan viimeisimmän koulutusohjelman`,
  ProgrammeDistributionCoursePopulation: `Näyttää sen koulutusohjelman, jossa opiskelija oli suorittaessaan kurssin`,
  GradeDistributionCoursePopulation: `Näyttää korkeimman arvosanan, jonka opiskelija on saanut valitulla aikavälillä.`,
  CreditDistributionCoursePopulation: `Näyttää tiedekunta-/ohjelmankohtaisen opintopistejakauman.`,
}
