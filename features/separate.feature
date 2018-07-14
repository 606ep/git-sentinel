Feature: stopOnErrors checker
    In order to run rules
    As a git sentinel class
    I need to have option to stop on first error in rule or not

    Background: Rules set
        Given there are the next rules:
            |   name      | mask    |  separate  |  stopOnErrors  |  cwd        |  commands                     |
            |   tsRule    | .*\.ts  |  true      | false          |  undefined  | ["testTs ${filename}"]        |
            |   jsRule    | .*\.js  |  true      | true           |  undefined  | ["testJs ${filename}"]        |
            |   index1    | index   |  false     | false          |  undefined  | ["cmd1.1", "error", "cmd1.2"] |
            |   index2    | index   |  false     | true           |  undefined  | ["cmd2.1", "error", "cmd2.2"] |
        

    Scenario: Stop on errors on separate
        Given the next files changed "one.js, error.js, two.js, one.ts, error.ts, two.ts"
        When I fire precommit hook
        Then "testTs one.ts" should be run once
        And "testTs two.ts" should be run once

        And "testJs one.js" should be run once
        And "testJs two.js" should not be run


    Scenario: stop on errors on non separate
        Given the next files changed "index.js"
        When I fire precommit hook

        Then "cmd1.1" should be run once
        And "cmd1.2" should be run once

        And "cmd2.1" should be run once
        And "cmd2.2" should not be run