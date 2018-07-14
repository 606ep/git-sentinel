Feature: Rule regexp checker
    In order to run rules
    As a git sentinel class
    I need to find what rules should be run based on files changed and regexps

    Background: Rules set
        Given there are the next rules:
            |   name      | mask    |  separate  |  stopOnErrors  |  cwd        |  commands             |
            |   tsRule    | .*\.ts  |  false     | false          |  undefined  | ["testTs"]            |
            |   jsRule    | .*\.js  |  false     | false          |  undefined  | ["testJs"]            |
            |   indexRule | index   |  true      | false          |  undefined  | ["index ${filename}"] |
        

    Scenario: Masks and separates
        Given the next files changed "index.ts, index.js, one.ts, two.ts"
        When I fire precommit hook
        Then "testTs" should be run once
        And "testJs" should be run once
        And "index index.ts" should be run once
        And "index index.js" should be run once