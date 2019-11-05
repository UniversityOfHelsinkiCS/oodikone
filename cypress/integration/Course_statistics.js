/// <reference types="Cypress" />

describe('Course Statistics tests', () => {
  beforeEach(() => {
    cy.server({
      onAnyRequest: function (route, proxy) {
        if (Cypress.config().baseUrl.includes("http://nginx/")) {
          proxy.xhr.setRequestHeader('uid', 'tktl')
          proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
          proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
          proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
        }
      }
    })
    console.log(Cypress.config().baseUrl)
    cy.visit(Cypress.config().baseUrl)
    cy.contains("Course statistics").click()
    cy.contains("Search for courses")
  })

  it('Searching single course having duplicate mappings shows course statistics', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by entering a course code']").type('TKT20003')
    cy.contains("tr", "TKT20003").click()
    cy.contains("Fetch statistics").should('be.enabled').click()
    cy.contains("Search for courses").should('not.exist')

    cy.contains("Käyttöjärjestelmät")
    cy.contains("TKT20003")
    cy.contains("582640") // old mapped code

    cy.contains(".tabular.menu a", "Table").click()
    cy.contains("All")
    cy.contains(".modeSelectorRow a", "Cumulative").click()
    cy.contains(".modeSelectorRow a", "Student").click()
    cy.contains(".modeSelectorRow a", "Grades").click()

    cy.contains(".tabular.menu a", "Pass rate chart").click()
    cy.get("div.modeSelectorContainer").click()
    cy.contains("svg", "Pass rate chart")

    cy.contains(".tabular.menu a", "Grade distribution chart").click()
    cy.get("div.modeSelectorContainer").click()
    cy.contains("svg", "Grades")

    cy.contains("a", "New query").click()
    cy.contains("Search for courses")
  })

  it('Searching multiple courses having duplicate mappings shows course statistics', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by entering a course code']").type('TKT')
    cy.contains("td", "TKT20003").click()
    cy.contains("td", /^TKT10002/).click()
    cy.contains("Fetch statistics").should('be.enabled').click()
    cy.contains("Search for courses").should('not.exist')

    cy.contains('.courseNameCell', "Käyttöjärjestelmät").contains("TKT20003").click()
    cy.contains('.courseNameCell', "Ohjelmoinnin perusteet").should('not.exist');
    cy.contains("TKT20003")
    cy.contains("582640") // old mapped code
    cy.contains("Summary").click()

    cy.contains('.courseNameCell', "Ohjelmoinnin perusteet").contains("TKT10002").click()
    cy.contains('.courseNameCell', "Käyttöjärjestelmät").should('not.exist');
    cy.contains("TKT10002")
    cy.contains("581325") // old mapped code
    cy.contains("Summary").click()

    cy.contains("a", "New query").click()
    cy.contains("Search for courses")
  })

  describe('When searching unified course stats', () => {
    beforeEach(() => {
      cy.url().should('include', '/coursestatistics')
      cy.contains("Search for courses")
      cy.get("input[name='unifyOpenUniCourses']").parent().click()
      cy.get("input[placeholder='Search by entering a course code']").type('TKT10002')
      cy.contains("td", "TKT10002, AYTKT10002").click()
      cy.contains("Fetch statistics").should('be.enabled').click()
      cy.contains("Search for courses").should('not.exist')
      cy.contains("TKT10002, 581325, A581325, AYTKT10002 Ohjelmoinnin perusteet")
    })

    const yearRange = { from: "2000-01", to: "2017-18" }
    const cumulativeTableContents = [
      // [time, passed, failed, passrate]
      ["2017-18", 175, 29, "85.78 %"],
      ["2016-17", 66, 2, "97.06 %"],
      ["2015-16", 27, 2, "93.10 %"],
      ["2014-15", 16, 0, "100.00 %"],
      ["2013-14", 6, 2, "75.00 %"],
    ]
    const studentTableContents = [
      // time, students, passedfirsttry, passedretry, pass%, failedfirsttry, failedretry, fail%]
      ["2017-18", 195, 131, 43, "89.23 %", 20, 1, "10.77 %"],
      ["2016-17", 67, 59, 6, "97.01 %", 2, 0, "2.99 %"],
      ["2015-16", 27, 24, 2, "96.30 %", 1, 0, "3.70 %"],
      ["2014-15", 16, 16, 0, "100.00 %", 0, 0, "0.00 %"],
      ["2013-14", 5, 2, 3, "100.00 %", 0, 0, "0.00 %"],
    ]
    const gradesTableContents = [
      // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
      ["2017-18", 204, 29, 5, 8, 10, 16, 127, 9],
      ["2016-17", 68, 2, 0, 1, 6, 10, 49, 0],
      ["2015-16", 29, 2, 1, 1, 0, 5, 16, 4],
      ["2014-15", 16, 0, 0, 0, 1, 0, 11, 4],
      ["2013-14", 8, 2, 0, 0, 2, 0, 4, 0],
    ]

    it('shows stats', () => {
      // Time range
      cy.get("div[name='fromYear']").within(() => {
        cy.get("div[role='option']").first().should("have.text", yearRange.to)
        cy.contains("div[role='option']", yearRange.from).should('have.class', 'selected')
        cy.get("div[role='option']").last().should("have.text", "2000-01")
        cy.get("div[role='option']").should('have.length', 18)
      })
      cy.get("div[name='toYear']").within(() => {
        cy.get("div[role='option']").first().should("have.text", "2017-18")
        cy.contains("div[role='option']", yearRange.to).should('have.class', 'selected')
        cy.get("div[role='option']").last().should("have.text", yearRange.from)
        cy.get("div[role='option']").should('have.length', 18)
      })
      cy.contains("Show population").should('be.enabled')

      // Filters
      const primaryContents = [
        // [studentcount, label, code]
        [179, "Tietojenkäsittelytieteen kandiohjelma", "KH50_005"],
        [64, "Matemaattisten tieteiden kandiohjelma", "KH50_001"],
        [24, "Tietojenkäsittelytieteen koulutusohjelma", "520080"],
        [16, "Tietojenkäsittelytieteen maisteriohjelma", "MH50_009"],
        [9, "Matematiikan koulutusohjelma", "520070"],
      ]
      const totalStudyProgrammes = 20
      cy.get("div[name='primary']").within(() => {
        primaryContents.forEach(([count, label, code], i) => {
          cy.get("div[role='option']").eq(i).within(() => {
            cy.contains(label)
            cy.contains("div>div:last-child>div.label", code)
            cy.contains("div>div:first-child>div.label", count)
          })
        })
        cy.get("div[role='option']").eq(10).within(() => {
          cy.contains("Muu")
          cy.contains("div>div:last-child>div.label", "OTHER")
          cy.contains("div>div:first-child>div.label", "2")
        })
        cy.get("div[role='option']").should('have.length', totalStudyProgrammes)
      })
      const comparisonContents = [
        [289, "All", "ALL"],
        ...primaryContents
      ]
      cy.get("div[name='comparison']").within(() => {
        comparisonContents.forEach(([count, label, code], i) => {
          cy.get("div[role='option']").eq(i).within(() => {
            cy.contains(label)
            cy.contains("div>div:last-child>div.label", code)
            cy.contains("div>div:first-child>div.label", count)
          })
        })
        cy.get("div[role='option']").eq(11).within(() => {
          cy.contains("Muu")
          cy.contains("div>div:last-child>div.label", "OTHER")
          cy.contains("div>div:first-child>div.label", "2")
        })
        cy.get("div[role='option']").should('have.length', totalStudyProgrammes+1) // +1 comes from already selected option
      })
      cy.contains("Select excluded study programmes").should("be.disabled")

      // Statistics
      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Cumulative").click()
      cy.get("#CourseStatPanes h3+table>tbody").within(() => {
        cumulativeTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Student").click()
      cy.get("#CourseStatPanes h3+table>tbody").within(() => {
        studentTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Grades").click()
      cy.get("#CourseStatPanes h3+table>tbody").within(() => {
        gradesTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })
    })

    it('after changing time range shows same stats', () => {
      const newYearRange = { from: "2014-15", to: "2016-17" }
      cy.get("div[name='fromYear']").click().within(() => {
        cy.contains(newYearRange.from).click()
      })
      cy.get("div[name='toYear']").click().within(() => {
        cy.contains(newYearRange.to).click()
      })

      // Time range
      cy.get("div[name='fromYear']").within(() => {
        cy.get("div[role='option']").first().should("have.text", newYearRange.to)
        cy.contains("div[role='option']", newYearRange.from).should('have.class', 'selected')
        cy.get("div[role='option']").last().should("have.text", "2000-01")
        cy.get("div[role='option']").should('have.length', 17)
      })
      cy.get("div[name='toYear']").within(() => {
        cy.get("div[role='option']").first().should("have.text", "2017-18")
        cy.contains("div[role='option']", newYearRange.to).should('have.class', 'selected')
        cy.get("div[role='option']").last().should("have.text", newYearRange.from)
        cy.get("div[role='option']").should('have.length', 4)
      })
      cy.contains("Show population").should('be.enabled')

      // Filters
      const primaryContentsAfterTimeChange = [
        // [studentcount, label, code]
        [79, "Tietojenkäsittelytieteen kandiohjelma", "KH50_005"],
        [15, "Tietojenkäsittelytieteen koulutusohjelma", "520080"],
        [10, "Tietojenkäsittelytieteen maisteriohjelma", "MH50_009"],
        [7, "Matemaattisten tieteiden kandiohjelma", "KH50_001"],
      ]
      const totalStudyProgrammesAfterTimeChange = 13
      cy.get("div[name='primary']").within(() => {
        primaryContentsAfterTimeChange.forEach(([count, label, code], i) => {
          cy.get("div[role='option']").eq(i).within(() => {
            cy.contains(label)
            cy.contains("div>div:last-child>div.label", code)
            cy.contains("div>div:first-child>div.label", count)
          })
        })
        cy.get("div[role='option']").eq(5).within(() => {
          cy.contains("Muu")
          cy.contains("div>div:last-child>div.label", "OTHER")
          cy.contains("div>div:first-child>div.label", "2")
        })
        cy.get("div[role='option']").should('have.length', totalStudyProgrammesAfterTimeChange)
      })
      const comparisonContentsAfterTimeChange = [
        [107, "All", "ALL"],
        ...primaryContentsAfterTimeChange
      ]
      cy.get("div[name='comparison']").within(() => {
        comparisonContentsAfterTimeChange.forEach(([count, label, code], i) => {
          cy.get("div[role='option']").eq(i).within(() => {
            cy.contains(label)
            cy.contains("div>div:last-child>div.label", code)
            cy.contains("div>div:first-child>div.label", count)
          })
        })
        cy.get("div[role='option']").eq(6).within(() => {
          cy.contains("Muu")
          cy.contains("div>div:last-child>div.label", "OTHER")
          cy.contains("div>div:first-child>div.label", "2")
        })
        cy.get("div[role='option']").should('have.length', totalStudyProgrammesAfterTimeChange+1) // +1 comes from already selected option
      })
      cy.contains("Select excluded study programmes").should("be.disabled")

      // Statistics
      const timeRangeFilter = (timeRange) => ([time]) => {
        return timeRange.from <= time && time <= timeRange.to
      }
      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Cumulative").click()
      cy.get("#CourseStatPanes h3+table>tbody").within(() => {
        cumulativeTableContents.filter(timeRangeFilter(newYearRange)).forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 3)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Student").click()
      cy.get("#CourseStatPanes h3+table>tbody").within(() => {
        studentTableContents.filter(timeRangeFilter(newYearRange)).forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 3)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Grades").click()
      cy.get("#CourseStatPanes h3+table>tbody").within(() => {
        gradesTableContents.filter(timeRangeFilter(newYearRange)).forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 3)
      })
    })

    it('after changing filters shows different stats', () => {
      cy.get("div[name='primary']").click().within(() => {
        cy.contains("div[role='option']", "Tietojenkäsittelytieteen kandiohjelma").click()
      })
      cy.get("body").type("{esc}") // close dropdown

      // Time range (should not have changed)
      cy.get("div[name='fromYear']").within(() => {
        cy.get("div[role='option']").first().should("have.text", yearRange.to)
        cy.contains("div[role='option']", yearRange.from).should('have.class', 'selected')
        cy.get("div[role='option']").last().should("have.text", "2000-01")
        cy.get("div[role='option']").should('have.length', 18)
      })
      cy.get("div[name='toYear']").within(() => {
        cy.get("div[role='option']").first().should("have.text", "2017-18")
        cy.contains("div[role='option']", yearRange.to).should('have.class', 'selected')
        cy.get("div[role='option']").last().should("have.text", yearRange.from)
        cy.get("div[role='option']").should('have.length', 18)
      })
      cy.contains("Show population").should('be.enabled')

      // Filters
      const primaryContentsAfterFilterChange = [
        // [studentcount, label, code]
        [289, "All", "ALL"],
        [64, "Matemaattisten tieteiden kandiohjelma", "KH50_001"],
        [24, "Tietojenkäsittelytieteen koulutusohjelma", "520080"],
        [16, "Tietojenkäsittelytieteen maisteriohjelma", "MH50_009"],
        [9, "Matematiikan koulutusohjelma", "520070"],
      ]
      const totalStudyProgrammesAfterFilterChange = 20
      cy.get("div[name='primary']").within(() => {
        primaryContentsAfterFilterChange.forEach(([count, label, code], i) => {
          cy.get("div[role='option']").eq(i).within(() => {
            cy.contains(label)
            cy.contains("div>div:last-child>div.label", code)
            cy.contains("div>div:first-child>div.label", count)
          })
        })
        cy.get("div[role='option']").should('have.length', totalStudyProgrammesAfterFilterChange)
      })
      const comparisonContentsAfterFilterChange = [
        // [studentcount, label, code]
        [289, "All", "ALL"],
        [179, "Tietojenkäsittelytieteen kandiohjelma", "KH50_005"],
        [122, "Excluded", "EXCLUDED"],
        [64, "Matemaattisten tieteiden kandiohjelma", "KH50_001"],
        [24, "Tietojenkäsittelytieteen koulutusohjelma", "520080"],
        [16, "Tietojenkäsittelytieteen maisteriohjelma", "MH50_009"],
        [9, "Matematiikan koulutusohjelma", "520070"],
      ]
      cy.get("div[name='comparison']").within(() => {
        comparisonContentsAfterFilterChange.forEach(([count, label, code], i) => {
          cy.get("div[role='option']").eq(i).within(() => {
            cy.contains(label)
            cy.contains("div>div:last-child>div.label", code)
            cy.contains("div>div:first-child>div.label", count)
          })
        })
        cy.get("div[role='option']").should('have.length', totalStudyProgrammesAfterFilterChange+2) // +2 comes from EXCLUDED and the filtered programme
      })
      cy.contains("Select excluded study programmes").should("be.enabled").click()

      // Statistics
      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Cumulative").click()
      cy.get("#PrimaryDataTable h3+table>tbody").within(() => {
        const cumulativeTableContents = [
          // [time, passed, failed, passrate]
          ["2017-18", 126, 10, "92.65 %"],
          ["2016-17", 56, 1, "98.25 %"],
          ["2015-16", 20, 1, "95.24 %"],
          ["2014-15", 6, 0, "100.00 %"],
        ]
        cumulativeTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })
      cy.get("#ComparisonDataTable h3+table>tbody").within(() => {
        const cumulativeTableContents = [
          // [time, passed, failed, passrate]
          ["2017-18", 52, 19, "73.24 %"],
          ["2016-17", 15, 1, "93.75 %"],
          ["2015-16", 9, 1, "90.00 %"],
          ["2014-15", 11, 0, "100.00 %"],
        ]
        cumulativeTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Student").click()
      cy.get("#PrimaryDataTable h3+table>tbody").within(() => {
        const studentTableContents = [
          // time, students, passedfirsttry, passedretry, pass%, failedfirsttry, failedretry, fail%]
          ["2017-18", 131, 86, 40, "96.18 %", 5, 0, "3.82 %"],
          ["2016-17", 56, 51, 4, "98.21 %", 1, 0, "1.79 %"],
          ["2015-16", 19, 17, 2, "100.00 %", 0, 0, "0.00 %"],
          ["2014-15", 6, 6, 0, "100.00 %", 0, 0, "0.00 %"],
        ]
        studentTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })
      cy.get("#ComparisonDataTable h3+table>tbody").within(() => {
        const studentTableContents = [
          // time, students, passedfirsttry, passedretry, pass%, failedfirsttry, failedretry, fail%]
          ["2017-18", 67, 48, 3, "76.12 %", 15, 1, "23.88 %"],
          ["2016-17", 15, 11, 3, "93.33 %", 1, 0, "6.67 %"],
          ["2015-16", 10, 9, 0, "90.00 %", 1, 0, "10.00 %"],
          ["2014-15", 11, 11, 0, "100.00 %", 0, 0, "0.00 %"],
        ]
        studentTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Grades").click()
      cy.get("#PrimaryDataTable h3+table>tbody").within(() => {
        const gradesTableContents = [
          // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
          ["2017-18", 136, 10, 3, 4, 4, 4, 102, 9],
          ["2016-17", 57, 1, 0, 1, 6, 8, 41, 0],
          ["2015-16", 21, 1, 1, 1, 0, 5, 11, 2],
          ["2014-15", 6, 0, 0, 0, 0, 0, 3, 3],
          ["2013-14", 1, 0, 0, 0, 0, 0, 1, 0],
        ]
        gradesTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })
      cy.get("#ComparisonDataTable h3+table>tbody").within(() => {
        const gradesTableContents = [
          // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
          ["2017-18", 71, 19, 2, 4, 6, 13, 27, 0],
          ["2016-17", 16, 1, 0, 0, 0, 3, 12, 0],
          ["2015-16", 10, 1, 0, 0, 0, 0, 7, 2],
          ["2014-15", 11, 0, 0, 0, 1, 0, 9, 1],
          ["2013-14", 8, 2, 0, 0, 2, 0, 4, 0],
        ]
        gradesTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 13)
      })
    })
  })
})
