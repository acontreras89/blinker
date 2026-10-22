Feature: Demo

  The whole product in one take, recorded for reviewers. Real Stripe test mode
  and real webhooks: needs `.env` and `stripe listen` (README). Run with
  `pnpm demo`; never part of `pnpm test:e2e`.

  # ONE SCENARIO ON PURPOSE: it is a script for a video, not a test suite.
  # Phrases come from the other features; only the local ones are new.
  Scenario: From the landing to a second document
    Given a visitor opens the landing
    When they look around the landing
    And they type "Monday. I will write the report today."
    And they start typing from the landing
    And they register with valid details
    And they pay in Stripe Checkout with a test card
    Then the editor contains "Monday. I will write the report today."
    When they try out the formatting
    And they open the toolbar
    And they save the document
    Then they are told the document is saved
    When they open the dashboard
    Then the dashboard lists "Untitled"
    # A NEW USER IS ON THE TRIAL (1 document): the second one shows the
    # upgrade path and ends the trial with the same test card.
    When they create a document
    Then they are told their trial includes 1 document
    When they start paying now
    And they type "The report, at last."
    And they save the document
    And they rename the document to "Report"
    And they open the dashboard
    Then the dashboard lists "Report, Untitled" in that order
    When they delete "Untitled" from the dashboard
    Then the dashboard lists "Report"
