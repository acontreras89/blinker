Feature: Landing

  The hero is a real editor: visitors try the product before signing up.

  Background:
    Given a visitor opens the landing

  Scenario: The landing sells the product and points to signup
    Then they see the product name
    And every call to action leads to registration
    And they see the pricing

  Scenario: Typing in the hero counts words and speed
    When they type "the cursor is judging me"
    Then the word count is 5
    And the words per minute are above 0

  Scenario: Deleting text lowers the word count but not the speed
    When they type "the cursor is judging me"
    And they delete everything they typed
    Then the word count is 0
    And the words per minute are above 0

  Scenario: The draft and stats survive a reload
    When they type "come back later"
    And they reload the page
    Then the editor contains "come back later"
    And the word count is 3
    And the words per minute are above 0

  Scenario: Resetting the stats keeps the draft
    When they type "fresh start please"
    And they reset the stats
    Then the editor contains "fresh start please"
    And the word count is 3
    And the words per minute are 0
