Feature: Smoke

  Scenario: The app serves the home page backed by the backend
    When a visitor opens the home page
    Then they see the product name
    And the backend status is "ok"
