Feature: Documents

  The dashboard lists a user's documents, newest first, and lets them rename
  or delete any of them. A document belongs to one user; to anyone else it
  does not exist.

  Rule: An empty dashboard says so and points to the editor

    Scenario: A user without documents is invited to start typing
      Given a logged-in user
      When they open the dashboard
      Then they are told they have no documents yet
      When they start typing from the dashboard
      Then they are on a blank editor

  Rule: New documents are numbered among the user's titles, lowest free first

    Scenario: The first document is called Untitled
      Given a logged-in user
      When they create a document
      Then the dashboard lists "Untitled"

    Scenario Outline: The next document takes the lowest free number
      Given a logged-in user with the documents "<existing>"
      When they create a document
      Then the dashboard lists "<new>"

      # "Untitled, Untitled (2)" → "Untitled (1)" PROVES THE LOWEST FREE NUMBER
      # IS REUSED, NOT MAX + 1.
      Examples:
        | existing               | new          |
        | Untitled               | Untitled (1) |
        | Untitled, Untitled (1) | Untitled (2) |
        | Untitled, Untitled (2) | Untitled (1) |
        | Untitled (1)           | Untitled     |

  Rule: Each document shows when it was last updated and when it was created

    Scenario: A document shows both dates
      Given a logged-in user with a document "Notes" created 3 days ago and last updated 2 hours ago
      When they open the dashboard
      Then "Notes" shows it was last updated 2 hours ago
      And "Notes" shows it was created 3 days ago
      And the exact date of each is available

  Rule: The most recently updated document comes first

    Scenario Outline: Touching an old document moves it to the top
      Given a logged-in user with the documents "Old, Middle, New"
      When they open the dashboard
      Then the dashboard lists "New, Middle, Old" in that order
      When they <change> "Old"
      Then the dashboard lists "<top>, New, Middle" in that order

      Examples:
        | change              | top     |
        | edit                | Old     |
        | rename to "Revived" | Revived |

  Rule: Renaming keeps a sensible title

    # The editor renames through the same rules; editor.feature covers only
    # its happy path.

    Scenario: A renamed document keeps its new title
      Given a logged-in user with the documents "Draft"
      When they rename "Draft" to "Final" from the dashboard
      And they reload the page
      Then the dashboard lists "Final"

    Scenario: Spaces around a title are dropped
      Given a logged-in user with the documents "Draft"
      When they rename "Draft" to "   Final   " from the dashboard
      Then the dashboard lists "Final"

    Scenario: An empty title restores the previous one
      Given a logged-in user with the documents "Draft"
      When they rename "Draft" to "" from the dashboard
      Then the dashboard lists "Draft"

    Scenario: A title over 100 characters is refused until it is shortened
      Given a logged-in user with the documents "Draft"
      When they try to rename "Draft" to a 101-character title
      Then they are told the title is too long
      And they are still editing the title
      When they cancel the rename
      Then the dashboard lists "Draft"

    # DUPLICATES ARE ALLOWED ON PURPOSE: a document's identity is its id, not
    # its title (ADR-0008). Do not add a uniqueness check.
    Scenario: Two documents may share a title
      Given a logged-in user with the documents "Draft, Final"
      When they rename "Final" to "Draft" from the dashboard
      Then the dashboard lists "Draft, Draft"

  Rule: Deleting asks first and cannot be undone

    Scenario: Cancelling keeps the document
      Given a logged-in user with the documents "Keep me"
      When they start deleting "Keep me" from the dashboard
      Then they are asked to confirm deleting "Keep me" for good
      When they cancel
      Then the dashboard lists "Keep me"

    Scenario: A deleted document is gone, address included
      Given a logged-in user with the documents "Bin me"
      When they delete "Bin me" from the dashboard
      Then the dashboard does not list "Bin me"
      When they open the address "Bin me" had
      Then they are told the page does not exist

  Rule: A document exists only for its owner

    Scenario: Another user's document looks like a missing one
      Given a logged-in user
      And another user has a document
      When they open the other user's document
      Then they are told the page does not exist

    Scenario: A document that never existed is not found
      Given a logged-in user
      When they open a document nobody has
      Then they are told the page does not exist

    Scenario: A link to their own document survives logging in
      Given a registered user who is not logged in
      And they have a document containing "where was I"
      When they open that document
      Then they are asked to log in
      When they log in
      Then the editor contains "where was I"
