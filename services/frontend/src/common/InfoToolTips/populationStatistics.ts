import { populationStudentsToolTips } from '@/common/InfoToolTips/populationStudents'

export const populationStatisticsToolTips = {
  curriculumPicker: {
    fi: `Valitsee käytettävän opetussuunnitelman. Vaikuttaa näytettäviin kursseihin ja opintokokonaisuuksiin.`,
    en: `Chooses which curriculum to use. Changes which courses and study modules are shown.`,
  },
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
Opiskelijoiden kumulatiiviset opintopistekertymät opiskelijakohtaisina kuvaajina.
Kun hiiren vie kuvaajien päälle, saa näkyviin jokaista kuvaajaa vastaavan opiskelijanumeron.
Yksittäisen opiskelijan kuvaajaa klikkaamalla siirtyy **student statistics**-sivulle, ja näkee valitun opiskelijan opintotiedot.
Timantin muotoinen ikoni kertoo opiskelijan valmistuneen valitusta koulutusohjelmasta kyseisellä hetkellä.

X-akselin skaalaa voi säätää kuvaajan alla olevaa liukusäädintä käyttäen.
Taulukon korkeutta voi säätää viereisistä painikkeista (small, medium, large).
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
Välien järjestystä pylväässä voi muuttaa valitsemalla **Chart settings** -valikosta haluamansa järjestyksen.

Pylväiden osat toimivat myös suodattimina. Klikkaamalla pylvään osaa näkyviin jäävät vain kyseiset opiskelijat (esimerkiksi keväällä 2024 0–30 opintopistettä suorittaneet).

**Cumulative**-valinnan ollessa käytössä kunkin opiskelijan kaikki aiemmat opintopisteet lasketaan mukaan opintopistemäärään.
Muutoin vain pylvästä vastaavalla aikavälillä kirjatut opintopisteet otetaan huomioon.
`,

  coursesOfClass: {
    curriculum: `
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
    showAllWithAtLeast: `
**Courses of Population**

Tämä taulukko sisältää näkyvissä olevien opiskelijoiden kaikki kurssisuoritukset.

Opiskelijat on mahdollista suodattaa kurssin perusteella käyttämällä kurssirivin vasemmassa laidassa olevaa suodatinpainiketta.
Kurssisuodatin aukeaa ikkunan vasempaan laitaan ja tarjoaa lisää vaihtoehtoja suodatukseen. Voit myös valita monta kurssia kerralla suodattimeen.

Klikkaamalla kurssin nimen vieressä olevaa sinistä nuolta, siirryt ko. kurssin **Course statistics** -näkymään.

Taulukon tietoja voi suodattaa antamalla opiskelijoiden vähimmäismäärän kurssilla kenttään *Show all courses or modules with at least N total students*.
Lisäksi kurssin nimi **name** ja koodisarakkeissa **code** suodatinkuvaketta klikkaamalla tulee esiin hakukentät suodattamista varten.
Suodattimet saa tyhjennettyä painamalla kentän vieressä olevaa ruksia tai valitsemall valikon alaosasta **Reset column filter**.

**Huom! Nämä suodattimet vaikuttavat vain tähän taulukkoon, eivät koko populaatioon.**

**Taulukot**
- **Pass/fail** - näkymä sisältää kurssisuoritukset, hylätyt, yritykset sekä ilmoittautumistiedot. Huom.! ilmoittautumistiedot ovat saatavilla vain Sisun käyttöönoton jälkeiseltä ajalta.
- **Grades** - arvosanajakauma.
`,
  },

  students: {
    ...populationStudentsToolTips,
  },

  search: `
Tässä osiossa voi tarkastella koulutusohjelmakohtaisia populaatioita sisäänottolukuvuoden mukaisesti, vuosikurssi kerrallaan.
Uudet koulutusohjelmat ovat pääsääntöisesti alkaneet 1.8.2017, joten oletusvalinnat näyttävät tiedot tästä päivämäärästä lähtien.

- **Class of**: lukuvuosi, jolloin opiskelija on ilmoittautunut ensimmäisen kerran (läsnä- tai poissaolevaksi) ohjelmaan. Ilmoittautumisen opinto-oikeus voi olla ensi- tai toissijainen.
- **Degree programme**: haluttu koulutusohjelma. Kiinnitetyt (suosikeiksi valitut) ohjelmat näkyvät ensimmäisinä valikossa. Kiinnitys on mahdollista koulutusohjelmalistauksessa.
- **Study track**: (valinnainen) koulutusohjelman opintosuunta. Valittavissa vain, jos ohjelmalla on opintosuuntia.
`,
  programmeDistributionCoursePopulation: {
    fi: `**Koulutusohjelma määritetään seuraavasti**:
1. Jos suoritukseen tai ilmoittautumiseen liittyy opiskeluoikeus, käytetään kyseiseen opiskeluoikeuteen liittyvää koulutusohjelmaa.
2. Jos kurssi on sijoitettu opintosuunnitelmaan (HOPS), käytetään sitä koulutusohjelmaa, jonka opintosuunnitelma on kyseessä.
3. Jos kumpikaan ei toteutunut, käytetään viimeisintä koulutusohjelmaa suorituksen tai ilmoittautumisen hetkellä.

**Avoin yliopisto**: Jos ilmoittautuminen tai suoritus on kirjattu avoimen yliopiston kautta, ja:
1. kurssi on sijoitettu opintosunnitelmaan, joka kuuluu tutkintoon johtavaan opinto-oikeuteen, käytetään tähän opinto-oikeuteen liittyvää koulutusohjelmaa.
2. opiskelijalla on ollut kyseisellä aikavälillä jokin aktiivinen opinto-oikeus, käytetään tähän opinto-oikeuteen liittyvää koulutusohjelmaa.

Jos mikään ehto ei toteudu, näytetään "Ei koulutusohjelmaa".`,
    en: `**Degree programme is calculated as follows**:
1. If the enrollment or attainment has an associated study right, use the degree programme associated with that study right.
2. If the course is placed in a personal study plan (HOPS), use the degree programme associated with that study plan.
3. If neither are true, use the latest active degree programme at the time of enrollment and/or attainment.

**Open university**: If the enrollment of the attainment is registered through open university, and:
1. the course is placed in a study plan belonging to a study right leading to a degree programme, use this degree programme.
2. the student had an active study right to some degree programme at the time, use that degree programme.

If none of the conditions apply, "No degree programme" is shown.`,
  },
  programmeDistributionCustomPopulation: {
    fi: `Taulukossa näytetään opiskelijoiden jakauma koulutusohjelmittain. Käytettävä koulutusohjelma on opiskelijan uusin aktiivinen koulutusohjelma. Jos opiskelijalla ei ole voimassa olevaa opinto-oikeutta, näytetään *Ei koulutusohjelmaa*.`,
    en: `Table shows how the students are distributed across degree programmes. Degree programme is obtained from each student's most recent active study right. If the student has no active study right, *No degree programme* is shown.`,
  },
  gradeDistributionCoursePopulation: 'Näyttää opiskelijan korkeimman arvosanan annetulta aikaväliltä.',
}
