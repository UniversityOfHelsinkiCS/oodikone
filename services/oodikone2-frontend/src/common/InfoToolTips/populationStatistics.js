export default {
  Main: `Tässä osiossa voi tarkastella koulutusohjelmakohtaisia populaatioita
  sisäänotto-lukuvuoden mukaisesti, vuosikurssi kerrallaan. Uudet koulutusohjelmat
  ovat pääsääntöisesti alkaneet 1.8.2017 joten oletusvalinnat näyttävät tiedot tästä päivämäärästä lähtien.
  <br>
  <br>
  **Class of:** lukuvuosi, jolloin opiskelija on ilmoittautunut ensimmäisen kerran (läsnä- tai poissaolevaksi) ohjelmaan. Ilmoittautumisen opinto-oikeus voi olla ensi- tai toissijainen. <br>
  **Statistics until:** tarkastelujakson päättymiskuukausi. <br>
  **Study programme:** haluttu koulutusohjelma.`,
  Advanced: `**Semesters:**  Jos haluaa tarkastella vain syyslukukaudella tai kevätlukukaudella ilmoittautuneita, haluttu ajanjakso valitaan tästä.

  **Include:** Koulutusohjelmapopulaatiosta on oletusarvoisesti suodatettu pois vaihto-opiskelijat, tutkinnonsuoritusoikeudesta luopuneet ja erillisopinto-oikeudella opiskelevat. Näitä ryhmiä voi sisällyttää mukaan lisäämällä ruksin haluamaansa kohtaan.`,
  QueryCard: `Valitun koulutusohjelmavuosikurssin perustiedot.
  <br>
  <br>
  **Sample size** luku sisältää läsnä- ja poissaolevaksi ilmoittautuneet opiskelijat, muttei "excludes"-ryhmiä, jotka voi määritellä koulutusohjelmaa valittaessa.
  <br>
  **Fall** = 1.8. - 31.12. ilmoittautuneet ja **Spring** = 1.1. - 31.7. ilmoittautuneet.
  <br>
  **showing XX months**: Dataa näytetään ohjelman vuosikurssin alkamispäivästä lähtien haluttuun kuukauteen asti (oletusarvoisesti "tähän päivään").
  <br>
  **Updated** kertoo milloin data on päivitetty ja **Update population** kohdasta datan voi päivittää käsin (päivitysoperaatio kestää noin 10 minuuttia, sivu on uudelleenladattava päivitetyt tiedot nähdäkseen).
  <br>
  Mustasta rastista voi sulkea valitun koulutusohjelmavuosikurssin.
  `,
  Filters: {
    Add: `Harmaata ”add” painiketta klikkaamalla aukeaa filters- eli suodatinvalikko, 
    josta voi lisätä haluamiaan suodattimia, jotka rajaavat valittua populaatiota. 
    Huom.! Filtterit eivät automaattisesti vaikuta ”Courses of population” taulukkoon (alempana). 
    "Courses of population" taulukon saa päivittymään filttereiden mukaiseksi painamalla harmaata 
    "refresh" -painiketta.`,
    Filters: `Valitut suodattimet näkyvät tässä. Suodattimia voi poistaa klikkaamalla mustaa rastia.
    <br> <br>
    **Show excluded students only**: Tällä liukukytkimellä voi valita filtteri-suodatuksien komplementin,
    eli liukukytkin päällä saa näkyviin poissuodatetut opiskelijat.
    <br> <br>
    **Clear all filters**: Poistaa kerralla valitut filtterit.
    <br> <br>
    **Save filters as preset**: Voit tallentaa tekemäsi filtteri-yhdistelmän myöhempää käyttöä varten.`,
    CreditsAtLeast: 'Suodattaa pois *opiskelijat*, joilla on alle annetun määrän opintopisteitä',
    CreditsLessThanFromMandatory: `Suodattaa pois opiskelijat, joilla on yli
    annetun määrän opintopisteitä pakollisista kursseista`,
    CreditsLessThan: 'Suodattaa opiskelijat, joilla on yli annetun määrän opintopisteitä',
    StartingThisSemester: `Paina kytkintä vaihtaaksesi suodatinta. Suodatin suodattaa opiskelijat,
    jotka ovat opiskelleet ennen valittua lukuvuotta tai päinvastoin`,
    EnrollmentStatus: 'Näytä opiskelijat, jotka olivat läsnä- tai poissaolevana valittuina lukukausina',
    CanceledStudyright: `Näytä opiskelijat, jotka peruuttivat virallisesti
    opinto-oikeutensa haetussa koulutusohjelmassa`,
    DisciplineTypes: `Asettaa annetun tyyppisille annettujen tieteenalojen
    kursseille automaattisesti osallistumissuodattimet.
    Voit asettaa rajan osallistumismäärälle tuodaksesi esiin vain suositut kurssit`,
    ExtentGraduated: `Luo suodatin joka suodattaa opiskelijat,
    jotka ovat/eivät ole opiskelleet/valmistuneet annetusta opintolaajuudesta.
    Voit esimerkiksi näyttää vain ne opiskelijat, jotka ovat valmistuneet kandidaatintutkinnosta`,
    TransferFilter: `Voit valita opiskelijat, jotka ovat vaihtaneet annetusta koulutusohjelmasta toiseen.
      Vaihtaminen tarkoittaa sitä, kun opiskelija vaihtaa koulutusohjelmaansa kesken opinto-oikeutensa.
      (eikä opiskelijaa joka saa opinto-oikeuden joltakin toiselta instituutiolta)`
  },
  CreditAccumulationGraph: `Opiskelijoiden kumulatiiviset opintopistekertymät opiskelijakohtaisina kuvaajina. Kun
    hiiren vie kuvaajien päälle, saa näkyviin jokaista kuvaajaa vastaavan opiskelijanumeron. Opiskelijanumeron
    yhteydessä olevaa ympyrää klikkaamalla siirtyy ”student statistics” puolelle ja näkee yksittäisen opiskelijan
    opintotiedot.
    <br>
    X-akselin skaalaa voi säätää harmaista painikkeista ”1m”, ”3m”, ”6m”, ”YTD”, ”1y” ja ”ALL” tai kuvaajan alla
    olevan sinisen näkymän harmaita ”kahvoja” siirtämällä. Y-akselin skaalaa voi säätää harmaista painikkeista
    ”small” ”medium” ja "large”`,
  CoursesOf: `Courses of population
    <br> <br>
    Tämä taulukko sisältää kaikkien populaatioon liittyvien opiskelijoiden kaikki kurssisuoritukset.
    <br> <br>
    **Huom.!** Filtterit eivät automaattisesti vaikuta ”Courses of population” taulukkoon. Taulukon saa 
    päivittymään filttereiden mukaiseksi painamalla harmaata "refresh" -painiketta.
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
    Klikkaamalla kurssin nimen vieressä olevaa mustaa nuolta siirtyy ”course statistics” 
    näkymään valitun kurssin osalta.
    <br> <br>
    **grades** arvosanajakauma
    <br> <br>
    **when passed** kurssisuorituksen ajankohdan. Huom.! ”passed” sarakkeen kokonaissumma ei välttämättä 
    täsmää puolivuosi-lukumäärien summan kanssa, johtuen tuplakirjauksista Oodissa.`,
  Students: `**Students:** harmaata "show" painiketta klikkaamalla saa listan kaikista populaation opiskelijoista
    (huom. suodattimet vaikuttavat tähän listaan!). Taulukko näyttää oletusarvoisesti vain 
    opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden nimet.
    <br> <br>
    **General:**
    <br> <br>
    Klikkaamalla opiskelijanumeron vieressä olevaa mustaa nuolta, siirtyy "student statistic" näkymään.    ”student statistics” näkymään valitun opiskelijan osalta.
    <br> <br>
    **credits since start**  listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson / populaation ajalta.
    <br> <br>
    **all credits:** listaa opiskelijan kaikki opintopisteet (myös aiemmat suoritukset, 
      eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)
    <br> <br>
    **Mandatory courses:**
    <br>
    Tällä välilehdellä näkyy, mitä pakollisiksi määriteltyjä kursseja opiskelija on suorittanut. 
    Kurssit voi määrittää kohdassa "Study program" > "Overview" > haluttu koulutusohjelma. 
    Scrollatessa kurssitaulukkoa alaspäin, kurssin nimen saa näkyviin viemällä kursorin halutun 
    solun kohdalle.
    <br> <br>
    **Download**:  klikkaamalla tätä harmaata kuvaketta, saa ladattua .xlsx tiedoston, 
    joka sisältää kaikki "General" ja "Mandatory Courses" välilehtien tiedot.
    `,
  CreditStatistics: `Opintopistekertymä-kategoria skaalautuvat valitun tarkastelujakson mukaan. 
    Jos tarkastelujaksoksi valitsee 12 kuukautta, ylin kategoria on 55 opintopistettä tai yli, 
    eli opiskelija etenee tavoiteajassa. Taulukosta näkee silmäyksellä tavoiteajassa etenevät (ylin kategoria) 
    ja myös esim. nollasuorittajat. Huom.! nollasuorittajissa on mukana myös poissaolevaksi ilmoittautuneet, 
    ellei heitä ole erikseen suodattanut populaatiosta pois. Kategorioita voi myös itsessään käyttää suodattimina, 
    eli klikkaamalla haluamaansa kategoriaa saa näkyviin vain sen kategorian opiskelijat. 
    Tämä suodatin löytyy ”Filters” otsikon alta ja sen voi poistaa klikkaamalla mustaa rastia.`
}
