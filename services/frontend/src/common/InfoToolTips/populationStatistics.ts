export const populationStatisticsToolTips = {
  advanced: {
    semesters:
      'Halutessa tarkastella vain syyslukukaudella (1.8.–31.12.) tai kevätlukukaudella (1.1.–31.7.) aloittaneita, haluttu ajanjakso valitaan tästä.',
    include:
      'Oletusarvoisesti pois suodatettuja ryhmiä voi sisällyttää mukaan tästä. Muutokset astuvat voimaan painamalla ”Fetch class with new settings”-painiketta.',
    legacy: `
    Tässä näkymässä on **oletusarvoisesti** suodatettu pois
    - vaihto-opiskelijat
    - opiskelijat, joilla ei ole tutkintoon johtavaa opinto-oikeutta
    - ohjelmasta poissiirtyneet opiskelijat

    Oletusarvoisia asetuksia voi muuttaa ”Advanced settings”-kohdassa.

    **Starting semesters**: Jos haluaa tarkastella vain syyslukukaudella (1.8.–31.12.) tai kevätlukukaudella (1.1.–31.7.) aloittaneita, haluttu ajanjakso valitaan tästä.

    **Include**: Oletusarvoisesti pois suodatetut ryhmät voi sisällyttää mukaan ja klikkaamalla ”Fetch class with new settings”-painiketta.
  `,
  },
  creditAccumulation: `
    **Credit accumulation**

    Opiskelijoiden kumulatiiviset opintopistekertymät opiskelijakohtaisina kuvaajina.
    Kun hiiren vie kuvaajien päälle, saa näkyviin jokaista kuvaajaa vastaavan opiskelijanumeron.
    Opiskelijanumeron yhteydessä olevaa ympyrää klikkaamalla siirtyy ”student statistics” puolelle ja näkee valitun opiskelijan opintotiedot.
    Timantin muotoinen ikoni kertoo opiskelijan valmistuneen valitusta koulutusohjelmasta kyseisellä hetkellä.

    X-akselin skaalaa voi säätää harmaista painikkeista ”1m”, ”3m”, ”6m”, ”YTD”, ”1y” ja ”ALL” tai kuvaajan alla olevan sinisen näkymän harmaita ”kahvoja” siirtämällä.
    Y-akselin skaalaa voi säätää harmaista painikkeista ”small” ”medium” ja "large”
  `,
  creditStatistics: `
    **Credits gained**

    Taulukko kertoo opintopistekertymän valitulle opiskelijapopulaatiolle. Opintopisteluokat on suhteutettu tarkasteltavan populaation aloitusvuoteen.
    Ylin luokka kertoo siksi aina tavoiteajassa etenevien määrän ja suhteellisen osuuden. 

    Jos *Personal study plan* -suodatin ei ole valittuna, suoritettuihin opintopisteisiin on laskettu **kaikki** taulukon otsikkorivillä ilmoitetulla aikavälillä suoritetut kurssit.
    Oletuksena aikavälin alkupäivä on 1.8. aloitusvuonna ja loppupäivä kuluva päivä. Alku- ja loppupäivää voi muuttaa sivun vasemman reunan *Date of course credits* -suodattimesta.
    *Personal study plan* -suodattimen ollessa valittuna huomioidaan kaikki valitun koulutusohjelman HOPSiin sijoitetut suoritukset.
    '*Date of course credits* -suodattimen valinnalla ei tällöin ole vaikutusta taulukon tietoihin, vaan kaikki HOPSiin sijoitetut suoritukset huomioidaan joka tapauksessa.

    Huom! Nollasuorittajissa on mukana myös poissaolevaksi ilmoittautuneet, ellei heitä ole erikseen suodatettu populaatiosta pois.

    Kategorioita voi myös itsessään käyttää suodattimina. Klikkaamalla rivin vasemmassa reunassa olevaa suodatinta jäävät näkyviin vain kyseisen kategorian opiskelijat.
    Suodatin aukeaa samalla ikkunan vasempaan laitaan, josta sitä voi käyttää vapaavalintaisilla arvoilla.

    **Statistics**

    Taulukko kertoo kaikkien tarkasteluun valittujen opiskelijoiden opintopistemääristä tähän päivään mennessä.
    Statistiikka on suodatettu käytettyjen filttereiden mukaan. Esimerkiksi, jos mukaan on valittu vain naisopiskelijat, statistiikat koskevat vain heitä. 

    - **Total credits** on kokonaisopintopistemäärä kyseiselle populaatiolle.
    - **Average** kuvaa opintopistemäärän opiskelijakohtaista keskiarvoa.
    - **Median** on keskimmäinen opintopistemäärä, joka saadaan järjestämällä opintopistemäärät suuruusjärjestykseen ja valitsemalla keskimmäinen arvo. Mikäli opiskelijoita on parillinen määrä, mediaani on kahden keskimmäisen arvon keskiarvo.
    - **Standard deviation** (keskihajonta) kuvaa vaihtelua opintopistemäärissä. Karkeasti, mitä suurempi keskihajonta, sitä enemmän opintopistemäärissä on vaihtelua opiskelijoiden kesken.
    - **Minimum** ja **Maximum** kertovat pienimmän ja suurimman opintopistemäärän, jotka jollain opiskelijoilla kyseisessä populaatiossa on.

    Mikäli valintatapatieto kyseiselle populaatiolle on saatavissa, näytetään myös samat statistiikat per valintatapa.

    **Distribution development**

    Pylväsdiagrammi kertoo opiskelijoiden jakauman opintopistehaarukoihin kalenterivuosittain, lukuvuosittain tai lukukausittain eriteltynä.
    Välien järjestystä pylväässä voi muuttaa valitsemalla **Stack ordering** -valikosta haluamansa järjestyksen.

    Pylväiden osat toimivat myös suodattimina. Klikkaamalla pylvään osaa näkyviin jäävät vain kyseiset opiskelijat (esimerkiksi keväällä 2024 0–30 opintopistettä suorittaneet).

    **Cumulative**-valinnan ollessa käytössä kunkin opiskelijan kaikki aiemmat opintopisteet lasketaan mukaan opintopistemäärään.
    Muutoin vain pylvästä vastaavalla aikavälillä kirjatut opintopisteet otetaan huomioon.
  `,
  coursesOfClass: `
    **Courses of class**

    Tämä taulukko sisältää näkyvissä olevien opiskelijoiden kaikki kurssisuoritukset.

    Opiskelijat on mahdollista suodattaa kurssin perusteella käyttämällä kurssirivin vasemmassa laidassa olevaa suodatinpainiketta.
    Kurssisuodatin aukeaa ikkunan vasempaan laitaan ja tarjoaa lisää vaihtoehtoja suodatukseen. Voit myös valita monta kurssia kerralla suodattimeen.

    Klikkaamalla kurssin nimen vieressä olevaa sinistä nuolta, siirryt ko. kurssin **Course statistics** -näkymään.

    Lisäksi kurssin nimi **name** ja koodisarakkeissa **code** suodatinkuvaketta klikkaamalla tulee esiin hakukentät suodattamista varten.
    Suodattimet saa tyhjennettyä painamalla kentän vieressä olevaa ruksia tai valitsemall valikon alaosasta **Reset column filter**.

    **Huom! Nämä suodattimet vaikuttavat vain tähän taulukkoon, eivät koko populaatioon.**
    Choose curriculum -valinta vaikuttaa siihen, minkä opetussuunnitelmakauden mukaiset kurssit näytetään taulukossa.

    **Taulukot**
    - **Pass/fail** - näkymä sisältää kurssisuoritukset, hylätyt, yritykset sekä ilmoittautumistiedot. Huom.! ilmoittautumistiedot ovat saatavilla vain Sisun käyttöönoton jälkeiseltä ajalta.
      - **Total students** - sarake näyttää kaikkien opiskelijoiden määrän, mukaanlukien ilmoittautuneet ilman arvosanaa.
      - **Enrolled, no grade** - sarake näyttää niiden opiskelijoiden määrän, joilla on ilmoittautuminen muttei arvosanaa eikä hylättyä suoritusta.
    - **Grades** - arvosanajakauma.
    - **When passed** - kurssisuorituksen ajankohta. Huom.! *Passed*-sarakkeen kokonaissumma ei välttämättä täsmää puolivuosittaisten lukumäärien summan kanssa johtuen tuplakirjauksista Oodissa.
  `,
  coursesOfPopulation: `
    **Courses of Population**

    Tämä taulukko sisältää näkyvissä olevien opiskelijoiden kaikki kurssisuoritukset.

    Opiskelijat on mahdollista suodattaa kurssin perusteella käyttämällä kurssirivin vasemmassa laidassa olevaa suodatinpainiketta.
    Kurssisuodatin aukeaa ikkunan vasempaan laitaan ja tarjoaa lisää vaihtoehtoja suodatukseen. Voit myös valita monta kurssia kerralla suodattimeen.

    Klikkaamalla kurssin nimen vieressä olevaa sinistä nuolta, siirryt ko. kurssin **Course statistics** -näkymään.

    Taulukon tietoja voi suodattaa antamalla opiskelijoiden vähimmäismäärän kurssilla kenttään *Limit to courses where student number at least*.
    Lisäksi kurssin nimi **name** ja koodisarakkeissa **code** suodatinkuvaketta klikkaamalla tulee esiin hakukentät suodattamista varten.
    Suodattimet saa tyhjennettyä painamalla kentän vieressä olevaa ruksia tai valitsemall valikon alaosasta **Reset column filter**.

    **Huom! Nämä suodattimet vaikuttavat vain tähän taulukkoon, eivät koko populaatioon.**

    **Taulukot**
    - **Pass/fail** - näkymä sisältää kurssisuoritukset, hylätyt, yritykset sekä ilmoittautumistiedot. Huom.! ilmoittautumistiedot ovat saatavilla vain Sisun käyttöönoton jälkeiseltä ajalta.
    - **Grades** - arvosanajakauma.
  `,
  search: `
    Tässä osiossa voi tarkastella koulutusohjelmakohtaisia populaatioita sisäänottolukuvuoden mukaisesti, vuosikurssi kerrallaan.
    Uudet koulutusohjelmat ovat pääsääntöisesti alkaneet 1.8.2017, joten oletusvalinnat näyttävät tiedot tästä päivämäärästä lähtien.

    - **Class of**: lukuvuosi, jolloin opiskelija on ilmoittautunut ensimmäisen kerran (läsnä- tai poissaolevaksi) ohjelmaan. Ilmoittautumisen opinto-oikeus voi olla ensi- tai toissijainen.
    - **Degree programme**: haluttu koulutusohjelma. Kiinnitetyt (suosikeiksi valitut) ohjelmat näkyvät ensimmäisinä valikossa. Kiinnitys on mahdollista koulutusohjelmalistauksessa.
    - **Study track**: (valinnainen) koulutusohjelman opintosuunta. Valittavissa vain, jos ohjelmalla on opintosuuntia.
  `,
  studentsGuidanceGroups: `
    **Students**

    Taulukko näyttää oletusarvoisesti vain opiskelijanumerot. Valitsemalla "Show student names" saat näkyviin myös opiskelijoiden nimet.

    Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan "Student statistics" -näkymään.

    Klikkaamalla "Sisu"-kuvaketta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä.

    **General**

    Valikoituja selvennyksiä: 
    - **Credits**
      - **All** listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson ajalta
      - **Since** listaa opiskelijan suoritetut opintopisteet määritellystä ajankohdasta alkaen
    - **Start of study right**: Opiskelijan valittuun ohjelmaan liittyvän opinto-oikeuden alkupäivä
    - **Degree programme**: Näyttää opiskelijan uusimman opinto-oikeuden. Opiskelijan kaikki opinto-oikeudet näkyvät uusimmasta vanhimpaan Excel-tiedostossa, sekä laittamalla hiiri solun päälle.
    - **Other programme**: Näkyy, jos ryhmälle on asetettu opinto-oikeus. Tämä korvaa Degree programme -sarakkeen, ja toimii muuten samoin mutta näyttää opiskelijan muista opinto-oikeuksista uusimman.
    - **Started in programme**: Opiskelijan valitussa ohjelmassa aloituspäivämäärä. Kandi+maisteriopiskelijoille kandiksi valmistumispäivämäärä +1.
  `,
  studentsClass: `
    **Students**

    Taulukko näyttää oletusarvoisesti vain opiskelijanumerot. Valitsemalla "Show student names" saat näkyviin myös opiskelijoiden nimet.

    Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan "Student statistics" -näkymään.

    Klikkaamalla "Sisu"-kuvaketta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä.

    **General**

    Valikoituja selvennyksiä: 
    - **Credits**
      - **All** listaa opiskelijan suoritetut opintopisteet valitun tarkastelujakson ajalta
      - **HOPS** listaa opiskelijan kaikki HOPSiin sijoitut opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)
      - **Since start in programme** listaa opiskelijan ohjelmassa aloittamisen jälkeen suoritut opintopisteet
    - **Transferred from**: Owpiskelijan vanha koulutusohjelma, josta opiskelija on siirtynyt uuteen.
    - **Start of study right**: Opiskelijan valittuun ohjelmaan liittyvän opinto-oikeuden alkupäivä
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

    Tällä välilehdellä näkyy, mitä opetussuunnitelmaan kuuluvia kursseja opiskelija on suorittanut. Valitsemalla "Include substitutions" otetaan mukaan myös arvosanat vastaavista kursseista.

    Merkkien selitykset:
    - ✓ Vihreä tarkastusmerkki = Opiskelija on suorittanut kurssin hyväksytysti
    - ✓ Harmaa tarkastusmerkki = Opiskelija on suorittanut kurssin vastaavalla kurssikoodilla
    - — Keltainen viiva = Opiskelijalla on alle 6kk vanha ilmoittautuminen kurssille
    - — Harmaa viiva = Opiskelijalla on yli 6kk vanha ilmoittautuminen kurssille
    - □ Harmaa laatikko = Opiskelija on lisännyt kurssin opintosuunitelmaansa, mutta ei ole ilmoittautunut kurssille tai suorittanut sitä

    **Modules**

    Tällä välilehdellä näkyy, mitä opintokokonaisuuksia opiskelija on valinnut opintosuunnitelmaansa. Näkymä ei huomioi valinnaisia opintokokonaisuuksia.

    **Tags**

    Opiskelijoille voi luoda tageja ryhmittelyä varten kohdassa "Degree Program" > "Overview" > haluttu koulutusohjelma.

    **Progress**

    Tämä näkymä on tällä hetkellä käytössä vain kandivaiheen opinto-ohjelmissa.
    Tällä välilehdellä näkyy opintojen kehitys annettujen kriteerien mukaan akateemista vuotta kohti. Kurssi merkataan tehdyksi, jos sillä on suoritusmerkintä tai hyväksiluku 
    minä tahansa lukuvuonna. Opintopistekriteerin täyttämiseen vaaditaan, että opintopisteet on suoritettu kyseisen akateemisen vuoden aikana.

    **Huomaa**, että klikkaamalla taulukon yläreunassa olevaa kolme pistettä sisältävää kuvaketta, voit ladata itsellesi Excel tiedoston.
    Tiedosto sisältää lisäksi muita sarakkeita, kuten läsnäolon lukukausittain sekä yhteystiedot.

    **Yhteystietojen käyttö on kuitenkin sallittua vain opintoneuvontaan liittyvissä asiossa.**
  `,
  studentsCustom: `
    **Students**

    Mikäli **"custom population"** -näkymää tarkasteltaessa ei ole erikseen valittu opinto-ohjelmaa, sarakkeissa olevat tiedot näytetään kunkin opiskelijan **Primary degree programme**  -sarakkeessa olevan (uusimman aktiivisen) ohjelman pohjalta

    Taulukko näyttää oletusarvoisesti vain opiskelijanumerot, mutta harmaata liukukytkintä klikkaamalla saa näkyviin opiskelijoiden muut yhteystiedot

    Klikkaamalla opiskelijanumeron vieressä olevaa sinistä henkilösymbolia, siirryt kyseisen opiskelijan **"student statistic"** -näkymään

    Klikkaamalla "Sisu"-nuolta, siirryt tarkastelemaan opiskelijan tietoja Sisu-järjestelmässä

    **All credits** listaa opiskelijan kaikki opintopisteet (myös aiemmat suoritukset, eli ne jotka tehty ennen valittuun tarkastelujaksoon ja populaatioon kuulumista)

    **Credits in HOPS** listaa tarkasteltavaan opinto-ohjelmaan liitettyyn opintosuunnitelmaan kuuluvat opintopisteet

    **Credits since start** listaa kuinka paljon opintopisteitä on kertynyt valitussa opinto-ohjelmassa aloittamisen jälkeen
  `,
  programmeDistributionCoursePopulation: `
    Koulutusohjelma määritetään seuraavasti:
    1. Jos suoritukseen tai ilmoittautumiseen liittyy opiskeluoikeus, käytetään kyseiseen opiskeluoikeuteen liittyvää koulutusohjelmaa, joka oli aktiivinen suorituksen tai ilmoittautumisen hetkellä
    2. Jos kurssi on sijoitettu opintosuunnitelmaan (HOPS), käytetään sitä koulutusohjelmaa, jonka opintosuunnitelma on kyseessä
    3. Jos suoritukseen tai ilmoittautumiseen ei liity opiskeluoikeutta eikä kurssia ole sijoitettu opintosuunnitelmaan, käytetään viimeisintä koulutusohjelmaa suorituksen tai ilmoittautumisen hetkellä
  `,
  programmeDistributionCustomPopulation: `
    Taulukossa näytetään opiskelijoiden jakauma koulutusohjelmittain. Käytettävä koulutusohjelma on opiskelijan uusin koulutusohjelma.
  `,
  gradeDistributionCoursePopulation: 'Näyttää korkeimman arvosanan, jonka opiskelija on saanut valitulla aikavälillä.',
  creditDistributionCoursePopulation: 'Näyttää tiedekunta-/ohjelmankohtaisen opintopistejakauman.',
  languageDistributionCoursePopulation: 'Näyttää kielijakauman kurssin suorituskielistä.',
}
