/// <reference types="Cypress" />

describe('Course Statistics tests', () => {
  beforeEach(() => {
    cy.init()
    cy.contains("Course statistics").click()
    cy.contains("Search for courses")
  })

  it('Searching single course having duplicate mappings shows course statistics', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by a course code']").type('TKT20003')
    cy.contains("tr", "TKT20003").click()
    cy.contains("Fetch statistics").should('be.enabled').click()
    cy.contains("Search for courses").should('not.exist')

    cy.contains("Käyttöjärjestelmät")
    cy.contains("TKT20003")
    cy.contains("582640") // old mapped code

    cy.contains(".tabular.menu a", "Table").click()
    cy.contains("All")
    cy.contains(".modeSelectorRow a", "Attempts").click()
    cy.contains(".modeSelectorRow a", "Students").click()

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
    cy.get("input[placeholder='Search by a course code']").type('TKT')
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

  it('On consecutive searches should not crash and search should work', () => {
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by a course code']").type('TKT20003')
    cy.contains("td", "TKT20003").click()
    cy.contains("Fetch statistics").should('be.enabled').click()
    cy.contains("Show population")
    cy.contains("TKT20003")

    cy.contains("Course statistics").click()
    cy.contains("Search for courses")
    //cy.wait(500)
    cy.get("input[placeholder='Search by a course code']").type('TKT20001')
    cy.contains("td", "TKT20001").click()
    cy.contains("Fetch statistics").should('be.enabled').click()
    cy.contains("Show population")
    cy.contains("TKT20001")
  })

  it('Shows statistics when separating by semester', () => {
    const courseCode = 'DATA11002'
    cy.url().should('include', '/coursestatistics')
    cy.contains("Search for courses")
    cy.get("input[placeholder='Search by a course code']").type(courseCode)
    cy.contains("td", courseCode).click()
    cy.contains("Separate statistics for Spring and Fall semesters").click()
    cy.contains("Fetch statistics").should('be.enabled').click()
    cy.contains("Kevät 2018")
    cy.contains("Syksy 2017")
    cy.get("tbody").contains("19")
    cy.contains(courseCode)
  })

  describe('When searching unified course stats', () => {
    beforeEach(() => {
      cy.url().should('include', '/coursestatistics')
      cy.contains("Search for courses")
      cy.get("input[name='unifyOpenUniCourses']").parent().click()
      cy.get("input[placeholder='Search by a course code']").type('TKT10002')
      cy.contains("td", "TKT10002, AYTKT10002").click()
      cy.contains("Fetch statistics").should('be.enabled').click()
      cy.contains("Search for courses").should('not.exist')
      cy.contains("TKT10002, 581325, A581325, AYTKT10002 Ohjelmoinnin perusteet")
    })

    const yearRange = { from: "2000-01", to: "2017-18" }
    const attemptsTableContents = [
      // [time, passed, failed, passrate]
      ["Total", 354, 312, 42, "88.14 %"],
      ["2017-18", 204, 175, 29, "85.78 %"],
      ["2016-17", 68, 66, 2, "97.06 %"],
      ["2015-16", 29, 27, 2, "93.10 %"],
      ["2014-15", 16, 16, 0, "100.00 %"],
      ["2013-14", 8, 6, 2, "75.00 %"],
    ]
    const studentTableContents = [
      // time, students, passedfirsttry, passedeventually, pass%, neverpassed, fail%]
      ["Total", 289, 254, 13,	"92.39 %", 22, "7.61 %"],
      ["2017-18", 157, 132, 5, "87.26 %", 20, "12.74 %"],
      ["2016-17", 62, 60, 1, "98.39 %", 1, "1.61 %"],
      ["2015-16", 27, 25, 2, "100.00 %", 0, "0.00 %"],
      ["2014-15", 16, 16, 0, "100.00 %", 0, "0.00 %"],
      ["2013-14", 5, 3, 2, "100.00 %", 0, "0.00 %"],
    ]
    const gradesTableContents = [
      // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
      ["Total", 354, 42, 6,	12,	24,	35,	218, 17],
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
      cy.contains("#CourseStatPanes a.item", "Attempts").click()
      cy.get("#CourseStatPanes table>tbody").within(() => {
        attemptsTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 14)
      })

      cy.get("#gradeToggle", { force: true }).click({ force: true })
      cy.get("#CourseStatPanes table>tbody").within(() => {
        gradesTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 14)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Students").click()
      cy.get("#CourseStatPanes table>tbody").within(() => {
        studentTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 14)
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
      
      const timeAttemptsTableContents = [
        // [time, passed, failed, passrate]
        ["Total", 113, 109, 4, "96.46 %"],
        ["2017-18", 204, 175, 29, "85.78 %"],
        ["2016-17", 68, 66, 2, "97.06 %"],
        ["2015-16", 29, 27, 2, "93.10 %"],
        ["2014-15", 16, 16, 0, "100.00 %"],
        ["2013-14", 8, 6, 2, "75.00 %"],
      ]

      const timeStudentTableContents = [
        // time, students, passedfirsttry, passedeventually, pass%, neverpassed, fail%]
        ["Total", 105, 101, 3,	"99.05 %", 1, "0.95 %"],
        ["2017-18", 195, 131, 43, "89.23 %", 1, "10.77 %"],
        ["2016-17", 62, 60, 1, "98.39 %", 1, "1.61 %"],
        ["2015-16", 27, 25, 2, "100.00 %", 0, "0.00 %"],
        ["2014-15", 16, 16, 0, "100.00 %", 0, "0.00 %"],
        ["2013-14", 5, 2, 3, "100.00 %", 0, "0.00 %"],
      ]

      const timeGradesTableContents = [
        // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
        ["Total", 113, 4,	1, 2,	7, 15, 76, 8],
        ["2017-18", 204, 29, 5, 8, 10, 16, 127, 9],
        ["2016-17", 68, 2, 0, 1, 6, 10, 49, 0],
        ["2015-16", 29, 2, 1, 1, 0, 5, 16, 4],
        ["2014-15", 16, 0, 0, 0, 1, 0, 11, 4],
        ["2013-14", 8, 2, 0, 0, 2, 0, 4, 0],
      ]

      // Statistics
      const timeRangeFilter = (timeRange) => ([time]) => {
        return (timeRange.from <= time && time <= timeRange.to) || time === 'Total'
      }
      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Attempts").click()
      cy.get("#CourseStatPanes table>tbody").within(() => {
        timeAttemptsTableContents.filter(timeRangeFilter(newYearRange)).forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 4)
      })

      cy.get("#gradeToggle", { force: true }).click({ force: true })
      cy.get("#CourseStatPanes table>tbody").within(() => {
        timeGradesTableContents.filter(timeRangeFilter(newYearRange)).forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 4)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Students").click()
      cy.get("#CourseStatPanes table>tbody").within(() => {
        timeStudentTableContents.filter(timeRangeFilter(newYearRange)).forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 4)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
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
      cy.contains("#CourseStatPanes a.item", "Attempts").click()
      cy.get("#PrimaryDataTable table>tbody").within(() => {
        const attemptsTableContents = [
          // [time, passed, failed, passrate]
          ["Total", 227, 215, 12, "94.71 %"],
          ["2017-18", 136, 126, 10, "92.65 %"],
          ["2016-17", 57, 56, 1, "98.25 %"],
          ["2015-16", 21, 20, 1, "95.24 %"],
          ["2014-15", 6, 6, 0, "100.00 %"],
        ]
        attemptsTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 14)
      })
      cy.get("#ComparisonDataTable table>tbody").within(() => {
        const attemptsTableContents = [
          // [time, passed, failed, passrate]
          ["Total", 140, 110, 30, "78.57 %"],
          ["2017-18", 71, 52, 19, "73.24 %"],
          ["2016-17", 16, 15, 1, "93.75 %"],
          ["2015-16", 10, 9, 1, "90.00 %"],
          ["2014-15", 11, 11, 0, "100.00 %"],
        ]
        attemptsTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 14)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Students").click()
      cy.get("#PrimaryDataTable table>tbody").within(() => {
        const studentTableContents = [
          // time, students, passedfirsttry, eventuallypassed, pass%, neverpassed, fail%]
          ["Total", 179, 168,	6, "97.21 %",	5,	"2.79 %"],
          ["2017-18", 95, 86, 4, "94.74 %", 5, "5.26 %"],
          ["2016-17", 53, 52, 1, "100.00 %", 0, "0.00 %"],
          ["2015-16", 19, 18, 1, "100.00 %", 0, "0.00 %"],
          ["2014-15", 6, 6, 0, "100.00 %", 0, "0.00 %"],
        ]
        studentTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 14)
      })
      cy.get("#ComparisonDataTable table>tbody").within(() => {
        const studentTableContents = [
          // time, students, passedfirsttry, passedeventually, pass%, neverpassed, fail%]
          ["Total", 122, 98, 7,	"86.07 %", 17, "13.93 %"],
          ["2017-18", 65, 49, 1, "76.92 %", 15, "23.08 %"],
          ["2016-17", 13, 12, 0, "92.31 %", 1, "7.69 %"],
          ["2015-16", 10, 9, 1, "100.00 %", 0, "0.00 %"],
          ["2014-15", 11, 11, 0, "100.00 %", 0, "0.00 %"],
        ]
        studentTableContents.forEach((values, trIndex) => {
          cy.get("tr").eq(trIndex).within(() => {
            values.forEach((value, tdIndex) => {
              cy.get("td").eq(tdIndex).contains(value)
            })
          })
        })
        cy.get("tr").should('have.length', 14)
      })

      cy.contains("#CourseStatPanes a.item", "Table").click()
      cy.contains("#CourseStatPanes a.item", "Attempts").click()
      cy.get("#gradeToggle", { force: true }).click({ force: true })

      cy.get("#PrimaryDataTable table>tbody").within(() => {
        const gradesTableContents = [
          // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
          ["Total", 227, 12, 4,	7, 11, 18, 161,	14],
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
        cy.get("tr").should('have.length', 14)
      })
      cy.get("#ComparisonDataTable table>tbody").within(() => {
        const gradesTableContents = [
          // [time, attempts, 0, 1, 2, 3, 4, 5, other passed]
          ["Total", 140, 30, 2,	5, 13, 20, 67, 3],
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
        cy.get("tr").should('have.length', 14)
      })
    })
  })
})
