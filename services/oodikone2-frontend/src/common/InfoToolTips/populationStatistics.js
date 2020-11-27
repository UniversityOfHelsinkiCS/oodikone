export default {
  Advanced: `**Semesters:**  Jos haluaa tarkastella vain syyslukukaudella tai kevätlukukaudella ilmoittautuneita, haluttu ajanjakso valitaan tästä.

  **Include:** Koulutusohjelmapopulaatiosta on oletusarvoisesti suodatettu pois vaihto-opiskelijat, tutkinnonsuoritusoikeudesta luopuneet ja erillisopinto-oikeudella opiskelevat. Näitä ryhmiä voi sisällyttää mukaan lisäämällä ruksin haluamaansa kohtaan.`,
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
    StudytrackFilter: `Palauttaa opiskelijat joilla on valittu kyseinen suuntautumisvaihtoehto`
  },
  ProgrammeDistributionCustomPopulation: `Näyttää opiskelijan viimeisimmän koulutusohjelman`,
  ProgrammeDistributionCoursePopulation: `Näyttää sen koulutusohjelman, jossa opiskelija oli suorittaessaan kurssin`,
  GradeDistributionCoursePopulation: `Näyttää korkeimman arvosanan, jonka opiskelija on saanut valitulla aikavälillä.`,
  CreditDistributionCoursePopulation: `Näyttää tiedekunta-/ohjelmankohtaisen opintopistejakauman.`
}
