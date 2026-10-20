Feature: Accounts

  Visitors register with a name, an email and a password and start writing
  right away. Each device keeps its own session; logging out ends only that one.

  Rule: Registering takes a visitor straight to the editor

    Scenario: A visitor who typed nothing lands on a blank editor
      Given a visitor opens the landing
      When they start typing from the landing
      And they register with valid details
      Then they are on a blank editor
      And they are logged in

    Scenario: What a visitor typed on the landing carries over to the editor
      Given a visitor opens the landing
      When they type "first words before signing up"
      And they start typing from the landing
      And they register with valid details
      Then the editor contains "first words before signing up"

    Scenario Outline: Registration rejects invalid details
      Given a visitor is registering
      When they register with <problem>
      Then they are told <message>
      And they are not registered

      Examples:
        | problem              | message                     |
        | an empty name        | their name is missing       |
        | an invalid email     | their email is invalid      |
        | a too short password | their password is too short |

    Scenario: An email can only be registered once
      Given a registered user
      And a visitor is registering
      When they register with the registered user's email
      Then they are told the email is already registered

  Rule: Logging in checks credentials, not password rules

    Scenario: A user logs in and lands on the dashboard
      Given a registered user
      When they log in
      Then they are on the dashboard
      And they are logged in

    Scenario Outline: Wrong credentials get one generic error
      Given a registered user
      When they log in with <credentials>
      Then they are told the email or password is incorrect

      # KEEP THE PASSWORD SHORT ON PURPOSE (and its step too): it proves login
      # does not apply the signup password rules. A long one would hide that.
      Examples:
        | credentials                            |
        | their email and a short wrong password |
        | an email nobody registered             |

    Scenario: Login rejects an invalid email before asking the server
      Given a visitor is logging in
      When they log in with an invalid email
      Then they are told their email is invalid

  Rule: Private areas need a session and return the user where they were going

    Scenario Outline: A visitor opening a private area logs in and gets there
      Given a registered user who is not logged in
      When they open <area>
      Then they are asked to log in
      When they log in
      Then they are on <area>

      Examples:
        | area           |
        | the dashboard  |
        | a blank editor |

    Scenario Outline: An unsafe return address falls back to the dashboard
      Given a registered user
      When they log in through a link that returns them to "<target>"
      Then they are on the dashboard

      Examples:
        | target                      |
        | https://evil.example        |
        | //evil.example              |
        | /a-page-that-does-not-exist |

    Scenario: A session survives a reload
      Given a logged-in user
      When they reload the page
      Then they are logged in

  Rule: The landing knows who is logged in

    Scenario: A logged-in user is offered the app and starts typing without registering
      Given a logged-in user
      When they open the landing
      Then the landing offers to open the app instead of logging in
      When they start typing from the landing
      Then they are on a blank editor

  Rule: Logging out ends only the current session, on the server

    Scenario: Logging out ends the session
      Given a logged-in user
      When they log out
      Then they are asked to log in
      And the session they had is rejected by the server

    Scenario: Logging out on one device keeps the others logged in
      Given a user logged in on two devices
      When they log out on the first device
      Then the first device is logged out
      And the second device is still logged in
