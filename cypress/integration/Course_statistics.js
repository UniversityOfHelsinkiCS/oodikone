/// <reference types="Cypress" />

describe('Course Statistics tests', () => {
  beforeEach(() => {
    cy.init()
    cy.contains('Course statistics').click()
    cy.contains('Search for courses')
  })

  it('Searching single course having substitution mappings shows course statistics', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains('Search for courses')
    cy.get("input[placeholder='Search by a course code']").type('TKT20001')
    // Click uni course, not avoin
    cy.contains('td', /^TKT20001/).click()
    cy.contains('Fetch statistics').should('be.enabled').click()
    cy.contains('Search for courses').should('not.exist')

    cy.contains('Tietorakenteet ja algoritmit')
    cy.contains('TKT20001')
    cy.contains('58131') // old mapped code

    cy.contains('.tabular.menu a', 'Table').click()
    cy.contains('All')
    cy.contains('.modeSelectorRow a', 'Attempts').click()
    cy.contains('.modeSelectorRow a', 'Students').click()

    cy.contains('.tabular.menu a', 'Pass rate chart').click()
    cy.get('div.modeSelectorContainer').click()
    cy.contains('svg', 'Pass rate chart')

    cy.contains('.tabular.menu a', 'Grade distribution chart').click()
    cy.get('div.modeSelectorContainer').click()
    cy.contains('svg', 'Grades')

    cy.contains('a', 'New query').click()
    cy.contains('Search for courses')
  })

  it('Searching multiple courses having substitution mappings shows course statistics', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains('Search for courses')
    cy.get("input[placeholder='Search by a course code']").type('TKT')
    cy.contains('td', /^TKT20001/).click()
    cy.contains('td', /^TKT10002/).click()
    cy.contains('Fetch statistics').should('be.enabled').click()
    cy.contains('Search for courses').should('not.exist')

    cy.contains('.courseNameCell', 'Tietorakenteet ja algoritmit').contains('TKT20001').click()
    cy.contains('.courseNameCell', 'Ohjelmoinnin perusteet').should('not.exist')
    cy.contains('TKT20001')
    cy.contains('58131') // old mapped code
    cy.contains('Summary').click()

    cy.contains('.courseNameCell', 'Ohjelmoinnin perusteet').contains('TKT10002').click()
    cy.contains('.courseNameCell', 'Käyttöjärjestelmät').should('not.exist')
    cy.contains('TKT10002')
    cy.contains('581325') // old mapped code
    cy.contains('Summary').click()

    cy.contains('a', 'New query').click()
    cy.contains('Search for courses')
  })

  it('On consecutive searches should not crash and search should work', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains('Search for courses')
    cy.get("input[placeholder='Search by a course code']").type('TKT20003')
    cy.contains('td', 'TKT20003').click()
    cy.contains('Fetch statistics').should('be.enabled').click()
    cy.contains('Show population')
    cy.contains('TKT20003')

    cy.contains('Course statistics').click()
    cy.contains('Search for courses')
    //cy.wait(500)
    cy.get("input[placeholder='Search by a course code']").type('TKT20001')
    cy.contains('td', 'TKT20001').click()
    cy.contains('Fetch statistics').should('be.enabled').click()
    cy.contains('Show population')
    cy.contains('TKT20001')
  })

  it('Shows statistics when separating by semester', () => {
    const courseCode = 'DATA11002'
    cy.url().should('include', '/coursestatistics')
    cy.contains('Search for courses')
    cy.get("input[placeholder='Search by a course code']").type(courseCode)
    cy.contains('td', courseCode).click()
    cy.contains('Separate statistics for Spring and Fall semesters').click()
    cy.contains('Fetch statistics').should('be.enabled').click()
    cy.contains('Syksy 2019')
    cy.contains('Syksy 2017')
    cy.get('tbody').contains('19')
    cy.contains(courseCode)
  })

  it('Searching course by name displays right courses', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains('Search for courses')
    cy.get("input[placeholder='Search by entering a course name']").type('tietokantojen perusteet')

    cy.contains('Tietokantojen perusteet')
    cy.contains('Avoin yo: Tietokantojen perusteet')
    cy.contains('A581328')
    cy.contains('AYTKT10004')
    cy.contains('TKT10004, 581328')
    cy.contains('td', /^TKT10004/).click()

    cy.contains('Fetch statistics').should('be.enabled').click()
    cy.contains('Search for courses').should('not.exist')

    cy.contains('TKT10004, 581328 Tietokantojen perusteet')
    cy.get('.right').click()
    cy.contains('No results')

    cy.get("input[placeholder='Search by entering a course name']").type('tietokantojen perusteet')
    cy.contains('td', /^AYTKT10004/).click()

    cy.contains('Fetch statistics').should('be.enabled').click()
    cy.contains('Search for courses').should('not.exist')
    cy.contains('AYTKT10004 Avoin yo: Tietokantojen perusteet')
  })

  describe('When searching unified course stats', () => {
    beforeEach(() => {
      cy.url().should('include', '/coursestatistics')
      cy.contains('Search for courses')
      cy.get("input[name='unifyOpenUniCourses']").parent().click()
      cy.get("input[placeholder='Search by a course code']").type('TKT10002')
      cy.contains('td', 'TKT10002, AYTKT10002').click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')
      cy.contains('TKT10002, 581325, AYTKT10002, A581325 Ohjelmoinnin perusteet')
    })

    // Statistics
    const yearRange = { from: '2000-2001', to: '2020-2021' }
    const attemptsTableContents = [
      // [time, passed, failed, passrate]
      ['Total', 511, 486, 25],
    ]
    /*
    const studentTableContents = [
      // time, students, passedfirsttry, passedeventually, pass%, neverpassed, fail%]
      ['Total', 289, 254, 13, '92.39 %', 22, '7.61 %'],
      ['2017-18', 157, 132, 5, '87.26 %', 20, '12.74 %'],
      ['2016-17', 62, 60, 1, '98.39 %', 1, '1.61 %'],
      ['2015-16', 27, 25, 2, '100.00 %', 0, '0.00 %'],
      ['2014-15', 16, 16, 0, '100.00 %', 0, '0.00 %'],
      ['2013-14', 5, 3, 2, '100.00 %', 0, '0.00 %'],
    ]
    */

    const gradesTableContents = [
      // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
      ['Total', 511, 25, 11, 17, 21, 59, 365, 13],
      ['2020-2021', 1, 0, 0, 0, 0, 0, 1, 0],
      ['2019-2020', 54, 4, 3, 1, 3, 4, 39, 0],
      ['2018-2019', 154, 7, 2, 6, 5, 15, 119, 0],
      ['2017-2018', 186, 9, 3, 5, 6, 16, 139, 8],
      ['2016-2017', 71, 2, 1, 2, 5, 13, 48, 0],
      ['2015-2016', 21, 1, 1, 1, 0, 7, 8, 3],
    ]

    it('shows stats', () => {
      // Time range
      cy.get("div[name='fromYear']").within(() => {
        cy.get("div[role='option']").first().should('have.text', yearRange.to)
        cy.contains("div[role='option']", yearRange.from).should('have.class', 'selected')
        cy.get("div[role='option']").last().should('have.text', '2000-2001')
        cy.get("div[role='option']").should('have.length', 21)
      })
      cy.get("div[name='toYear']").within(() => {
        cy.get("div[role='option']").first().should('have.text', '2020-2021')
        cy.contains("div[role='option']", yearRange.to).should('have.class', 'selected')
        cy.get("div[role='option']").last().should('have.text', yearRange.from)
        cy.get("div[role='option']").should('have.length', 21)
      })
      cy.contains('Show population').should('not.be.enabled')

      /*
      const timeRangeFilter =
        timeRange =>
        ([time]) => {
          return (timeRange.from <= time && time <= timeRange.to) || time === 'Total'
        }
*/
      cy.contains('#CourseStatPanes a.item', 'Table').click()
      cy.contains('#CourseStatPanes a.item', 'Attempts').click()
      cy.get('#CourseStatPanes table>tbody').within(() => {
        attemptsTableContents.forEach((values, trIndex) => {
          cy.get('tr')
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get('td').eq(tdIndex).contains(value)
              })
            })
        })
        cy.get('tr').should('have.length', 17)
      })
      cy.get('[data-cy=gradeToggle]', { force: true }).click({ force: true })
      cy.get('#CourseStatPanes table>tbody').within(() => {
        gradesTableContents.forEach((values, trIndex) => {
          cy.get('tr')
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get('td').eq(tdIndex).contains(value)
              })
            })
        })
        cy.get('tr').should('have.length', 17)
      })
    })

    it('after changing time range shows same stats', () => {
      const newYearRange = { from: '2016-2017', to: '2019-2020' }
      cy.get("div[name='fromYear']")
        .click()
        .within(() => {
          cy.contains(newYearRange.from).click()
        })
      cy.get("div[name='toYear']")
        .click()
        .within(() => {
          cy.contains(newYearRange.to).click()
        })

      // Time range
      cy.get("div[name='fromYear']").within(() => {
        cy.get("div[role='option']").first().should('have.text', newYearRange.to)
        cy.contains("div[role='option']", newYearRange.from).should('have.class', 'selected')
        cy.get("div[role='option']").last().should('have.text', '2000-2001')
        cy.get("div[role='option']").should('have.length', 20)
      })
      cy.get("div[name='toYear']").within(() => {
        cy.get("div[role='option']").first().should('have.text', '2020-2021')
        cy.contains("div[role='option']", newYearRange.to).should('have.class', 'selected')
        cy.get("div[role='option']").last().should('have.text', newYearRange.from)
        cy.get("div[role='option']").should('have.length', 5)
      })
      cy.contains('Show population').should('be.enabled')
    })
    /*
      // Filters
      // Data currently has only "Muu" so we can't test these yet! See
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/3058
      // const primaryContents = [
      //   // [studentcount, label, code]
      //   [179, "Tietojenkäsittelytieteen kandiohjelma", "KH50_005"],
      //   [64, "Matemaattisten tieteiden kandiohjelma", "KH50_001"],
      //   [24, "Tietojenkäsittelytieteen koulutusohjelma", "520080"],
      //   [16, "Tietojenkäsittelytieteen maisteriohjelma", "MH50_009"],
      //   [9, "Matematiikan koulutusohjelma", "520070"],
      // ];
      // const totalStudyProgrammes = 20;
      // cy.get("div[name='primary']").within(() => {
      //   primaryContents.forEach(([count, label, code], i) => {
      //     cy.get("div[role='option']")
      //       .eq(i)
      //       .within(() => {
      //         cy.contains(label);
      //         cy.contains("div>div:last-child>div.label", code);
      //         cy.contains("div>div:first-child>div.label", count);
      //       });
      //   });
      //   cy.get("div[role='option']")
      //     .eq(10)
      //     .within(() => {
      //       cy.contains("Muu");
      //       cy.contains("div>div:last-child>div.label", "OTHER");
      //       cy.contains("div>div:first-child>div.label", "2");
      //     });
      //   cy.get("div[role='option']").should(
      //     "have.length",
      //     totalStudyProgrammes
      //   );
      // });
      // const comparisonContents = [[289, "All", "ALL"], ...primaryContents];
      // cy.get("div[name='comparison']").within(() => {
      //   comparisonContents.forEach(([count, label, code], i) => {
      //     cy.get("div[role='option']")
      //       .eq(i)
      //       .within(() => {
      //         cy.contains(label);
      //         cy.contains("div>div:last-child>div.label", code);
      //         cy.contains("div>div:first-child>div.label", count);
      //       });
      //   });
      //   cy.get("div[role='option']")
      //     .eq(11)
      //     .within(() => {
      //       cy.contains("Muu");
      //       cy.contains("div>div:last-child>div.label", "OTHER");
      //       cy.contains("div>div:first-child>div.label", "2");
      //     });
      //   cy.get("div[role='option']").should(
      //     "have.length",
      //     totalStudyProgrammes + 1
      //   ); // +1 comes from already selected option
      // });
      // cy.contains("Select excluded study programmes").should("be.disabled");

        

      // Filters
      // Data currently has only "Muu" so we can't test these yet! See
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/3058
      //const primaryContentsAfterTimeChange = [
      //  // [studentcount, label, code]
      //  [79, "Tietojenkäsittelytieteen kandiohjelma", "KH50_005"],
      //  [15, "Tietojenkäsittelytieteen koulutusohjelma", "520080"],
      //  [10, "Tietojenkäsittelytieteen maisteriohjelma", "MH50_009"],
      //  [7, "Matemaattisten tieteiden kandiohjelma", "KH50_001"],
      //];
      //const totalStudyProgrammesAfterTimeChange = 13;
      //cy.get("div[name='primary']").within(() => {
      //  primaryContentsAfterTimeChange.forEach(([count, label, code], i) => {
      //    cy.get("div[role='option']")
      //      .eq(i)
      //      .within(() => {
      //        cy.contains(label);
      //        cy.contains("div>div:last-child>div.label", code);
      //        cy.contains("div>div:first-child>div.label", count);
      //      });
      //  });
      //  cy.get("div[role='option']")
      //    .eq(5)
      //    .within(() => {
      //      cy.contains("Muu");
      //      cy.contains("div>div:last-child>div.label", "OTHER");
      //      cy.contains("div>div:first-child>div.label", "2");
      //    });
      //  cy.get("div[role='option']").should(
      //    "have.length",
      //    totalStudyProgrammesAfterTimeChange
      //  );
      //});
      //const comparisonContentsAfterTimeChange = [
      //  [107, "All", "ALL"],
      //  ...primaryContentsAfterTimeChange,
      //];
      //cy.get("div[name='comparison']").within(() => {
      //  comparisonContentsAfterTimeChange.forEach(([count, label, code], i) => {
      //    cy.get("div[role='option']")
      //      .eq(i)
      //      .within(() => {
      //        cy.contains(label);
      //        cy.contains("div>div:last-child>div.label", code);
      //        cy.contains("div>div:first-child>div.label", count);
      //      });
      //  });
      //  cy.get("div[role='option']")
      //    .eq(6)
      //    .within(() => {
      //      cy.contains("Muu");
      //      cy.contains("div>div:last-child>div.label", "OTHER");
      //      cy.contains("div>div:first-child>div.label", "2");
      //    });
      //  cy.get("div[role='option']").should(
      //    "have.length",
      //    totalStudyProgrammesAfterTimeChange + 1
      //  ); // +1 comes from already selected option
      //});
      //cy.contains("Select excluded study programmes").should("be.disabled");

      const timeAttemptsTableContents = [
        // [time, passed, failed, passrate]
        ["Total", 113, 109, 4, "96.46 %"],
        ["2017-18", 204, 175, 29, "85.78 %"],
        ["2016-17", 68, 66, 2, "97.06 %"],
        ["2015-16", 29, 27, 2, "93.10 %"],
        ["2014-15", 16, 16, 0, "100.00 %"],
        ["2013-14", 8, 6, 2, "75.00 %"],
      ];

      const timeStudentTableContents = [
        // time, students, passedfirsttry, passedeventually, pass%, neverpassed, fail%]
        ["Total", 105, 101, 3, "99.05 %", 1, "0.95 %"],
        ["2017-18", 195, 131, 43, "89.23 %", 1, "10.77 %"],
        ["2016-17", 62, 60, 1, "98.39 %", 1, "1.61 %"],
        ["2015-16", 27, 25, 2, "100.00 %", 0, "0.00 %"],
        ["2014-15", 16, 16, 0, "100.00 %", 0, "0.00 %"],
        ["2013-14", 5, 2, 3, "100.00 %", 0, "0.00 %"],
      ];

      const timeGradesTableContents = [
        // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
        ["Total", 113, 4, 1, 2, 7, 15, 76, 8],
        ["2017-18", 204, 29, 5, 8, 10, 16, 127, 9],
        ["2016-17", 68, 2, 0, 1, 6, 10, 49, 0],
        ["2015-16", 29, 2, 1, 1, 0, 5, 16, 4],
        ["2014-15", 16, 0, 0, 0, 1, 0, 11, 4],
        ["2013-14", 8, 2, 0, 0, 2, 0, 4, 0],
      ];

    

    // Not working since only "Muu" students
    it("after changing filters shows different stats", () => {
      cy.get("div[name='primary']")
        .click()
        .within(() => {
          cy.contains(
            "div[role='option']",
            "Tietojenkäsittelytieteen kandiohjelma"
          ).click();
        });
      cy.get("body").type("{esc}"); // close dropdown

      // Time range (should not have changed)
      cy.get("div[name='fromYear']").within(() => {
        cy.get("div[role='option']").first().should("have.text", yearRange.to);
        cy.contains("div[role='option']", yearRange.from).should(
          "have.class",
          "selected"
        );
        cy.get("div[role='option']").last().should("have.text", "2000-2001");
        cy.get("div[role='option']").should("have.length", 21);
      });
      cy.get("div[name='toYear']").within(() => {
        cy.get("div[role='option']").first().should("have.text", "2020-2021");
        cy.contains("div[role='option']", yearRange.to).should(
          "have.class",
          "selected"
        );
        cy.get("div[role='option']").last().should("have.text", yearRange.from);
        cy.get("div[role='option']").should("have.length", );
      });
      cy.contains("Show population").should("be.enabled");

      // Filters
      // Data currently has only "Muu" so we can't test these yet! See
      // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/3058
      const primaryContentsAfterFilterChange = [
        // [studentcount, label, code]
        [289, "All", "ALL"],
        [64, "Matemaattisten tieteiden kandiohjelma", "KH50_001"],
        [24, "Tietojenkäsittelytieteen koulutusohjelma", "520080"],
        [16, "Tietojenkäsittelytieteen maisteriohjelma", "MH50_009"],
        [9, "Matematiikan koulutusohjelma", "520070"],
      ];
      const totalStudyProgrammesAfterFilterChange = 20;
      cy.get("div[name='primary']").within(() => {
        primaryContentsAfterFilterChange.forEach(([count, label, code], i) => {
          cy.get("div[role='option']")
            .eq(i)
            .within(() => {
              cy.contains(label);
              cy.contains("div>div:last-child>div.label", code);
              cy.contains("div>div:first-child>div.label", count);
            });
        });
        cy.get("div[role='option']").should(
          "have.length",
          totalStudyProgrammesAfterFilterChange
        );
      });
      const comparisonContentsAfterFilterChange = [
        // [studentcount, label, code]
        [289, "All", "ALL"],
        [179, "Tietojenkäsittelytieteen kandiohjelma", "KH50_005"],
        [122, "Excluded", "EXCLUDED"],
        [64, "Matemaattisten tieteiden kandiohjelma", "KH50_001"],
        [24, "Tietojenkäsittelytieteen koulutusohjelma", "520080"],
        [16, "Tietojenkäsittelytieteen maisteriohjelma", "MH50_009"],
        [9, "Matematiikan koulutusohjelma", "520070"],
      ];
      cy.get("div[name='comparison']").within(() => {
        comparisonContentsAfterFilterChange.forEach(
          ([count, label, code], i) => {
            cy.get("div[role='option']")
              .eq(i)
              .within(() => {
                cy.contains(label);
                cy.contains("div>div:last-child>div.label", code);
                cy.contains("div>div:first-child>div.label", count);
              });
          }
        );
        cy.get("div[role='option']").should(
          "have.length",
          totalStudyProgrammesAfterFilterChange + 2
        ); // +2 comes from EXCLUDED and the filtered programme
      });
      cy.contains("Select excluded study programmes")
        .should("be.enabled")
        .click();

      // Statistics
      cy.contains("#CourseStatPanes a.item", "Table").click();
      cy.contains("#CourseStatPanes a.item", "Attempts").click();
      cy.get("#PrimaryDataTable table>tbody").within(() => {
        const attemptsTableContents = [
          // [time, passed, failed, passrate]
          ["Total", 227, 215, 12, "94.71 %"],
          ["2017-18", 136, 126, 10, "92.65 %"],
          ["2016-17", 57, 56, 1, "98.25 %"],
          ["2015-16", 21, 20, 1, "95.24 %"],
          ["2014-15", 6, 6, 0, "100.00 %"],
        ];
        attemptsTableContents.forEach((values, trIndex) => {
          cy.get("tr")
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get("td").eq(tdIndex).contains(value);
              });
            });
        });
        cy.get("tr").should("have.length", 14);
      });
      cy.get("#ComparisonDataTable table>tbody").within(() => {
        const attemptsTableContents = [
          // [time, passed, failed, passrate]
          ["Total", 140, 110, 30, "78.57 %"],
          ["2017-18", 71, 52, 19, "73.24 %"],
          ["2016-17", 16, 15, 1, "93.75 %"],
          ["2015-16", 10, 9, 1, "90.00 %"],
          ["2014-15", 11, 11, 0, "100.00 %"],
        ];
        attemptsTableContents.forEach((values, trIndex) => {
          cy.get("tr")
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get("td").eq(tdIndex).contains(value);
              });
            });
        });
        cy.get("tr").should("have.length", 14);
      });

      cy.contains("#CourseStatPanes a.item", "Table").click();
      cy.contains("#CourseStatPanes a.item", "Students").click();
      cy.get("#PrimaryDataTable table>tbody").within(() => {
        const studentTableContents = [
          // time, students, passedfirsttry, eventuallypassed, pass%, neverpassed, fail%]
          ["Total", 179, 168, 6, "97.21 %", 5, "2.79 %"],
          ["2017-18", 95, 86, 4, "94.74 %", 5, "5.26 %"],
          ["2016-17", 53, 52, 1, "100.00 %", 0, "0.00 %"],
          ["2015-16", 19, 18, 1, "100.00 %", 0, "0.00 %"],
          ["2014-15", 6, 6, 0, "100.00 %", 0, "0.00 %"],
        ];
        studentTableContents.forEach((values, trIndex) => {
          cy.get("tr")
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get("td").eq(tdIndex).contains(value);
              });
            });
        });
        cy.get("tr").should("have.length", 14);
      });
      cy.get("#ComparisonDataTable table>tbody").within(() => {
        const studentTableContents = [
          // time, students, passedfirsttry, passedeventually, pass%, neverpassed, fail%]
          ["Total", 122, 98, 7, "86.07 %", 17, "13.93 %"],
          ["2017-18", 65, 49, 1, "76.92 %", 15, "23.08 %"],
          ["2016-17", 13, 12, 0, "92.31 %", 1, "7.69 %"],
          ["2015-16", 10, 9, 1, "100.00 %", 0, "0.00 %"],
          ["2014-15", 11, 11, 0, "100.00 %", 0, "0.00 %"],
        ];
        studentTableContents.forEach((values, trIndex) => {
          cy.get("tr")
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get("td").eq(tdIndex).contains(value);
              });
            });
        });
        cy.get("tr").should("have.length", 14);
      });

      cy.contains("#CourseStatPanes a.item", "Table").click();
      cy.contains("#CourseStatPanes a.item", "Attempts").click();
      cy.get("[data-cy=gradeToggle]", { force: true }).click({ force: true });

      cy.get("#PrimaryDataTable table>tbody").within(() => {
        const gradesTableContents = [
          // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
          ["Total", 227, 12, 4, 7, 11, 18, 161, 14],
          ["2017-18", 136, 10, 3, 4, 4, 4, 102, 9],
          ["2016-17", 57, 1, 0, 1, 6, 8, 41, 0],
          ["2015-16", 21, 1, 1, 1, 0, 5, 11, 2],
          ["2014-15", 6, 0, 0, 0, 0, 0, 3, 3],
          ["2013-14", 1, 0, 0, 0, 0, 0, 1, 0],
        ];
        gradesTableContents.forEach((values, trIndex) => {
          cy.get("tr")
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get("td").eq(tdIndex).contains(value);
              });
            });
        });
        cy.get("tr").should("have.length", 14);
      });
      cy.get("#ComparisonDataTable table>tbody").within(() => {
        const gradesTableContents = [
          // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
          ["Total", 140, 30, 2, 5, 13, 20, 67, 3],
          ["2017-18", 71, 19, 2, 4, 6, 13, 27, 0],
          ["2016-17", 16, 1, 0, 0, 0, 3, 12, 0],
          ["2015-16", 10, 1, 0, 0, 0, 0, 7, 2],
          ["2014-15", 11, 0, 0, 0, 1, 0, 9, 1],
          ["2013-14", 8, 2, 0, 0, 2, 0, 4, 0],
        ];
        gradesTableContents.forEach((values, trIndex) => {
          cy.get("tr")
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get("td").eq(tdIndex).contains(value);
              });
            });
        });
        cy.get("tr").should("have.length", 14);
      });
    });
  });
*/

    it('Some features of Course Statistics are hidden for courseStatistics-users', () => {
      cy.contains('Users').click()
      cy.contains('Oodikone users')
      cy.contains('mocking').should('not.exist')
      cy.contains('tr', 'User manager').within(() => {
        cy.contains('.button', 'Edit').click()
      })

      cy.get('[data-cy=access-groups-form]').click().contains('courseStatistics').click()
      cy.get('[data-cy=access-groups-save]').click()

      cy.route('POST', '/api/superlogin/usermk').as('superlogin')
      cy.get('i.spy').click()
      cy.wait('@superlogin')
      cy.contains('mocking as usermk')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000)

      cy.get('[data-cy=navbar-courseStatistics]').click()
      cy.get('[data-cy=course-code-input]').type('TKT20003')
      cy.contains('tr', 'TKT20003').click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Filter statistics by study programmes').should('not.exist')
      cy.contains('Faculty statistics').should('not.exist')
      cy.contains('Show population').should('not.exist')

      const attemptsTableContents = [
        // [time, passed, failed, passrate]
        ['Total*', 288, 213, 75, '73.96 %'],
        ['2020-2021', '5 or less students', 'NA', 'NA', 'NA'],
        ['2019-2020', 164, 121, 43, '73.78 %'],
        ['2018-2019', 85, 60, 25, '70.59 %'],
        ['2017-2018', 39, 32, 7, '82.05 %'],
      ]

      cy.contains('#CourseStatPanes a.item', 'Attempts').click()
      cy.get('#CourseStatPanes table>tbody').within(() => {
        attemptsTableContents.forEach((values, trIndex) => {
          cy.get('tr')
            .eq(trIndex)
            .within(() => {
              values.forEach((value, tdIndex) => {
                cy.get('td').eq(tdIndex).contains(value)
              })
            })
        })
        cy.get('tr').should('have.length', 7)
      })

      cy.contains('Stop mocking').click()
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000)

      cy.contains('Users').click()
      cy.contains('Oodikone users')
      cy.contains('tr', 'User manager').within(() => {
        cy.contains('.button', 'Edit').click()
      })
      cy.contains('Access Groups')
        .siblings()
        .within(() => {
          cy.get("i[class='dropdown icon clear']").click()
        })
      cy.get('[data-cy=access-groups-save]').click()
    })
  })
})
