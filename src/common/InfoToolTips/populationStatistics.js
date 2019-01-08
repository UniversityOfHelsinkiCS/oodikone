export default {
  Main: `Tässä osiossa voi tarkastella koulutusohjelmakohtaisia populaatioita 
  sisäänotto-lukuvuoden mukaisesti, vuosikurssi kerrallaan. Uudet koulutusohjelmat 
  ovat pääsääntöisesti alkaneet 1.8.2017 joten oletusvalinnat näyttävät tiedot tästä päivämäärästä lähtien.  
  <br>
  **Enrollment:** lukuvuosi, jolloin opiskelija on ilmoittautunut ensimmäisen kerran (läsnä- tai poissaolevaksi) 
  ohjelmaan. <br>
  **Statistics until:** tarkastelujakson päättymiskuukausi. <br>
  **Study programme:** haluttu koulutusohjelma.`,
  Advanced: `**Semesters:**  Jos haluaa tarkastella vain syyslukukaudella tai kevätlukukaudella ilmoittautuneita, 
  haluttu ajanjakso valitaan tästä.`,
  QueryCard: `Valitun populaation perustiedot. ”Sample size” luku sisältää kaikki tähän populaatioon liittyvät 
    opiskelijat: läsnä- ja poissaolevaksi ilmoittautuneet, määräaikaiset ulkomaalaiset opiskelijat 
    sekä opinto-oikeutensa peruneet opiskelijat.`,
  Filters: {
    Add: `Harmaata ”add” painiketta klikkaamalla aukeaa filters- eli suodatinvalikko, josta voi 
      lisätä haluamiaan suodattimia, jotka rajaavat valittua populaatiota. Huom.! Filtterit eivät vaikuta 
      ”Courses of population” taulukkoon (alempana).`,
    Filters: `Valitut suodattimet näkyvät tässä. Suodattimia voi poistaa klikkaamalla mustaa rastia.
     Huom.! valitusta populaatiosta on oletusarvoisesti suodatettu pois määräaikaiset ulkomaalaiset opiskelijat 
     ja opiskelijat, jotka ovat peruuttaneet opinto-oikeutensa.`,
    CreditsAtLeast: 'Removes *students* that do not have at least given amount of credits',
    CreditsLessThanFromMandatory: `Removes students that have more than the given  
        amount of credits from the set of mandatory courses`,
    CreditsLessThan: 'Removes students that have more than the given amount of credits',
    StartingThisSemester: `Switch the toggle to choose a filter that removes 
      students that have studied before this population enrollment date or vice versa`,
    EnrollmentStatus: 'Show students that we\'re present or absent during the chosen semesters',
    CanceledStudyright: '*Show* students that officially canceled their studyright to the queried program',
    DisciplineTypes: `Automatically gives course participation filters for 
      the given course types of the given discipline. You can set a limit for 
      participations to bring up only the popular courses.`,
    ExtentGraduated: `Build a filter to students that have or have not studied or graduated a given extent
     of studies. For example here you can show students that have graduated from a bachelor's degree`,
    TransferFilter: `You can choose students that transfered from a given programme to another. 
      Transfer means a student that changed their program during his studyright (not a student getting 
      another studyright at some other institution)`
  },
  CreditAccumulationGraph: `Opiskelijoiden kumulatiiviset opintopistekertymät opiskelijakohtaisina kuvaajina. Kun 
    hiiren vie kuvaajien päälle, saa näkyviin jokaista kuvaajaa vastaavan opiskelijanumeron. Opiskelijanumeron 
    yhteydessä olevaa ympyrää klikkaamalla siirtyy ”student statistics” puolelle ja näkee yksittäisen opiskelijan 
    opintotiedot.
    <br>
    X-akselin skaalaa voi säätää harmaista painikkeista ”1m”, ”3m”, ”6m”, ”YTD”, ”1y” ja ”ALL” tai kuvaajan alla 
    olevan sinisen näkymän harmaita ”kahvoja” siirtämällä. Y-akselin skaalaa voi säätää harmaista painikkeista 
    ”small” ”medium” ja "large”`,
  CoursesOf: `Tämä taulukko sisältää kaikkien populaatioon liittyvien opiskelijoiden kaikki kurssisuoritukset. Esim. 
    ”Filters” –valikon suodattimet eivät vaikuta tämän taulukon dataan. Taulukon tietoja voi suodattaa kohdassa 
    ”limit to courses where student number at least” kirjoittamalla haluamansa opiskelijalukumäärän kenttään sekä 
    kohdassa ”code (filter here)” kirjoittamalla haluamansa kurssikoodin alun kenttään ja näkyviin jää esimerkiksi 
    vain ”MAT”-alkuiset. Huom.! Nämä suodattimet ovat ”taulukon sisäisiä” suodattimia, eivätkä siis ilmesty ”Filters” 
    otsikon alle. Suodattimet saa pois tyhjentämällä kentän kirjoittamistaan merkeistä ja painamalla ENTER.
    <br> <br> 
    Taulukossa on kolme eri näkymää ”pass/fail”, ”grades” ja ”when passed”.
    <br> <br> 
    **pass/fail** tämä on oletusnäkymä ja sisältää kurssisuoritukset, hylätyt sekä yritykset. Taulukon tietoja voi 
    järjestää eri sarakkeita (n, after retry, percentage, many times, per student, passed ja attempted) painamalla.
    <br> <br> 
    Kurssin nimen perässä olevasta mustasta nuolesta painamalla siirtyy ”course statistics” näkymään valitun kurssin 
    osalta.
    <br> <br> 
    **grades** arvosanajakauma
    <br> <br> 
    **when passed** näyttää kurssisuorituksen ajankohdan. Huom.! ”passed” sarakkeen kokonaissumma ei välttämättä 
    täsmää puolivuosi-lukumäärien summan kanssa, johtuen tuplakirjauksista Oodissa. Asiaa selvitetään ja pyritään 
    korjaamaan mahdollisimman pian.`,
  Students: `**Students:** harmaata painiketta ”show” klikkaamalla saa listan kaikista populaation opiskelijoista 
    (huom. suodattimet vaikuttavat tähän listaan!). Klikkaamalla opiskelijanumeron vieressä olevaa nappia siirtyy 
    ”student statistics” näkymään valitun opiskelijan osalta.
    <br> <br>
    **credits since start:** listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson ajalta.
    <br> <br>
    **all credits:** listaa opiskelijan kaikki opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen 
      valittuun tarkastelujaksoon ja populaatioon kuulumista)
    `
}
