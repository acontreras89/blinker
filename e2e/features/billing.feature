Feature: Billing

  Writing needs a subscription: monthly, with a 3-day trial limited to one
  document. Without one, a user still logs in, reads and deletes their
  documents, and is always one step from subscribing. Stripe is the source of
  truth: nothing the browser sends grants access.

  Rule: Leaving Checkout without paying leaves a user without a subscription

    Scenario: Cancelling Checkout after registering lands on the dashboard
      Given a visitor opens the landing
      When they start typing from the landing
      And they register with valid details
      And they leave Checkout without paying
      Then they are on the dashboard
      And they are invited to subscribe

  Rule: Writing unlocks only once Stripe confirms the payment

    Scenario: A late confirmation still unlocks writing
      Given a logged-in user without a subscription
      When they come back from Checkout before Stripe confirms the payment
      Then they are told the payment is being confirmed
      When Stripe confirms the payment
      Then they are on a blank editor

    Scenario: A confirmation that never comes says writing unlocks later
      Given a logged-in user without a subscription
      When they come back from Checkout before Stripe confirms the payment
      And Stripe stays silent for a while
      Then they are told writing unlocks as soon as Stripe confirms
      And they are offered the dashboard

    # THE OTHER USER'S CHECKOUT IS PAID ON PURPOSE: it proves the return checks
    # whose payment it is, not only that one was made. (Their own unpaid
    # Checkout is the late-confirmation case above.)
    Scenario Outline: A Checkout return that is not theirs grants nothing
      Given a logged-in user without a subscription
      When they come back from <checkout>
      Then they are on the dashboard
      And they are told the Checkout is not theirs
      And they are invited to subscribe
      When they reload the page
      Then they are no longer told the Checkout is not theirs

      Examples:
        | checkout                       |
        | another user's paid Checkout   |
        | a Checkout that does not exist |

  Rule: Without a subscription, documents are read-only but stay theirs

    Scenario: Creating a document without a subscription opens Checkout
      Given a logged-in user without a subscription
      When they open the dashboard
      Then they are invited to subscribe
      When they create a document
      Then they are in Checkout

    Scenario: A lapsed user reads and deletes their documents
      Given a logged-in user with the documents "Old notes"
      And Stripe reports their subscription is canceled
      When they open "Old notes"
      Then they can read it but not edit it
      And they are invited to subscribe
      When they delete "Old notes" from the dashboard
      Then the dashboard does not list "Old notes"

    # THE SERVER IS THE GATE: these bypass the UI on purpose.
    Scenario Outline: The server refuses writing without a subscription
      Given a logged-in user with the documents "Old notes"
      And Stripe reports their subscription is canceled
      When they <action> through the server directly
      Then the server <outcome>

      Examples:
        | action             | outcome |
        | create a document  | refuses |
        | edit "Old notes"   | refuses |
        | rename "Old notes" | refuses |
        | read "Old notes"   | allows  |
        | delete "Old notes" | allows  |

    Scenario: A subscription ending mid-session stops the next save, not the text
      Given a logged-in user editing a document
      When Stripe reports their subscription is canceled
      And they type "do not lose this"
      And they save the document
      Then they are told their subscription no longer lets them save
      And the editor contains "do not lose this"
      And they are invited to subscribe

  Rule: The subscription's state decides whether they can write

    # "PAST DUE" AND "CANCELED, STILL IN THE PERIOD" CAN WRITE ON PURPOSE:
    # Stripe is still retrying, or the user already paid for the period.
    Scenario Outline: Writing follows the subscription's state
      Given a logged-in user whose subscription is <state>
      When they open a blank editor
      Then they <can> write

      Examples:
        | state                               | can    |
        | trialing                            | can    |
        | active                              | can    |
        | past due                            | can    |
        | canceled at period end, still in it | can    |
        | canceled at period end, past it     | cannot |
        | canceled                            | cannot |
        | unpaid                              | cannot |
        | incomplete                          | cannot |

    Scenario: A failed payment warns while it keeps them writing
      Given a logged-in user whose subscription is past due
      When they open the dashboard
      Then they are told their last payment failed

  Rule: The trial includes one document and is offered once

    Scenario: A new user is offered the trial
      Given a visitor is registering
      When they register with valid details
      Then Checkout offers them a 3-day trial

    Scenario: A second document on the trial waits until they start paying
      Given a logged-in user on a trial with the documents "First"
      When they create a document
      Then they are told their trial includes 1 document
      When they start paying now
      Then they are on a blank editor
      When they type "second thoughts"
      And they save the document
      Then the dashboard lists "Untitled, First"

    Scenario: A blank editor at the trial's limit says so before any typing
      Given a logged-in user on a trial with the documents "First"
      When they open a blank editor
      Then they are told their trial includes 1 document

    Scenario: A user who had a subscription gets no second trial
      Given a logged-in user whose subscription is canceled
      When they create a document
      Then Checkout offers them no trial

  Rule: A subscriber is never sent to Checkout twice

    # A SUBSCRIBER HAS NO BUTTON FOR THIS: the step asks the server directly.
    Scenario: A subscriber starting Checkout lands on their billing page
      Given a logged-in user
      When they start a Checkout
      Then they are on their billing page

  Rule: The billing page shows the state and hands off to Stripe

    Scenario Outline: The billing page tells where the subscription stands
      Given a logged-in user <who>
      When they open their billing page
      Then they are told <what>

      Examples:
        | who                                                       | what                        |
        | on a trial                                                | when their trial ends       |
        | whose subscription is active                              | when it renews              |
        | whose subscription is past due                            | their last payment failed   |
        | whose subscription is canceled at period end, still in it | until when they have access |
        | without a subscription                                    | they have no subscription   |

    Scenario: Managing billing opens Stripe's portal
      Given a logged-in user
      When they open their billing page
      And they manage billing
      Then they are in Stripe's billing portal
