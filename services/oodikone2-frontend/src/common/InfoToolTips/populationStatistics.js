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
    Add: `Harmaata ”add” painiketta klikkaamalla aukeaa filters- eli suodatinvalikko, josta voi
      lisätä haluamiaan suodattimia, jotka rajaavat valittua populaatiota. Huom.! Filtterit eivät vaikuta
      ”Courses of population” taulukkoon (alempana).`,
    Filters: `Valitut suodattimet näkyvät tässä. Suodattimia voi poistaa klikkaamalla mustaa rastia.
     Huom.! valitusta populaatiosta on oletusarvoisesti suodatettu pois määräaikaiset ulkomaalaiset opiskelijat
     ja opiskelijat, jotka ovat peruuttaneet opinto-oikeutensa.`,
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
    (huom. suodattimet vaikuttavat tähän listaan!).
    <br> <br>
    **General:**
    <br>
    Klikkaamalla opiskelijanumeron vieressä olevaa nappia siirtyy
    ”student statistics” näkymään valitun opiskelijan osalta.
    <br>
    **credits since start** listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson ajalta.
    <br>
    **all credits:** listaa opiskelijan kaikki opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen
      valittuun tarkastelujaksoon ja populaatioon kuulumista).
    <br> <br>
    **Mandatory courses:**
    <br>
    Tällä välilehdellä näkyy mitä pakollisiksi määritettyjä kursseja opiskelija on suorittanut.
    Pitämällä kursoria kentän päällä näet kentän otsikon.
    `
}
