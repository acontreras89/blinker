Feature: Editor

  A blank page and a cursor. Everything else is a keystroke or a mouse move
  away: the header with title and save, the toolbar, the counters. Saving is
  never silent about failure.

  Rule: A document is created on its first save

    Scenario Outline: Saving a new document keeps it
      Given a logged-in user
      When they open a blank editor
      And they type "a brand new thought"
      Then they are told the document has unsaved changes
      When they save the document <how>
      Then they are told the document is saved
      When they reload the page
      Then the editor contains "a brand new thought"
      And the dashboard lists "Untitled"

      Examples:
        | how                        |
        | with the save button       |
        | with the keyboard shortcut |

    Scenario: Leaving a blank editor untouched creates nothing
      Given a logged-in user
      When they open a blank editor
      And they open the dashboard
      Then they are told they have no documents yet

  Rule: Saving an existing document keeps the latest content

    Scenario: Edits to a saved document survive a reload
      Given a logged-in user editing a document containing "first"
      When they type " and second"
      And they save the document
      And they reload the page
      Then the editor contains "first and second"

  Rule: A failed save is never hidden

    Scenario: A save that fails says so and can be retried
      Given a logged-in user editing a document
      And saving fails
      When they type "do not lose this"
      And they save the document
      Then they are told the document was not saved
      When saving works again
      And they save the document
      Then they are told the document is saved

    Scenario: Leaving with unsaved changes asks first
      Given a logged-in user editing a document
      When they type "not yet saved"
      And they try to leave the page
      Then they are asked to confirm leaving

  Rule: With two tabs, the last explicit save wins and says so

    Scenario: The overwriting tab is warned
      Given a logged-in user with a document open in two tabs
      When they type "from the first tab" in the first tab and save it
      And they type "from the second tab" in the second tab and save it
      Then the second tab is told its version replaced a newer one
      When they reload the first tab
      Then the first tab's editor contains "from the second tab"
      And the first tab's editor does not contain "from the first tab"

  Rule: The title and the document can be managed from the editor

    # The title follows the dashboard's rename rules (documents.feature),
    # over-long titles included; only the happy path is repeated here.

    Scenario: Renaming from the editor
      Given a logged-in user editing a document titled "Draft"
      When they rename the document to "Final"
      And they open the dashboard
      Then the dashboard lists "Final"

    Scenario: Deleting from the editor lands on the dashboard
      Given a logged-in user editing a document titled "Bin me"
      When they delete the document
      Then they are on the dashboard
      And the dashboard does not list "Bin me"

  Rule: The landing draft becomes a document on its first save

    Scenario: A visitor's draft becomes their first document
      Given a visitor opens the landing
      When they type "typed before signing up"
      And they start typing from the landing
      And they register with valid details
      And they save the document
      Then the dashboard lists "Untitled"
      When they open the landing
      And they start typing from the landing
      Then they are on a blank editor

    Scenario: A logged-in user's landing draft carries over too
      Given a logged-in user
      When they open the landing
      And they type "typed while logged in"
      And they start typing from the landing
      Then the editor contains "typed while logged in"

  Rule: The page is all there is until they ask for more

    # Header modes: "on request" (default) starts hidden and hides again when
    # they type; "until typing" starts shown and hides when they type;
    # "always" never hides. The mode is kept per device.

    Scenario: By default a document opens with only the text and the counters
      Given a logged-in user editing a document
      Then they see only the text and the counters

    Scenario Outline: The header comes back on request and leaves on typing
      Given a logged-in user editing a document
      When they <ask>
      Then they see the header
      When they type "back to work"
      Then they do not see the header

      Examples:
        | ask                          |
        | point at the top of the page |
        | press Escape                 |

    Scenario Outline: The header mode decides when the header shows
      Given a logged-in user editing a document
      When they set the header to show <mode>
      And they reload the page
      Then they <on open> the header
      When they type "back to work"
      Then they <after typing> the header

      Examples:
        | mode         | on open    | after typing |
        | until typing | see        | do not see   |
        | always       | see        | see          |
        | on request   | do not see | do not see   |

    Scenario: On a touch device the header and toolbar are always there
      Given a logged-in user editing a document on a touch device
      Then they see the header
      And they see the toolbar

  Rule: Every format has a shortcut or a Markdown rule

    Scenario Outline: Formatting with a shortcut
      Given a logged-in user editing an empty document
      When they type "<text>" as <format> with its shortcut
      Then the editor shows "<text>" as <format>

      Examples:
        | text   | format          |
        | loud   | bold            |
        | slant  | italic          |
        | gone   | strikethrough   |
        | x = 1  | inline code     |
        | Title  | a heading 1     |
        | Part   | a heading 2     |
        | Bit    | a heading 3     |
        | item   | a bulleted list |
        | step   | a numbered list |
        | quoted | a quote         |
        | let x  | a code block    |

    Scenario Outline: Formatting with Markdown
      Given a logged-in user editing an empty document
      When they type "<markdown>"
      Then the editor shows "<text>" as <format>

      Examples:
        | markdown | text   | format          |
        | **loud** | loud   | bold            |
        | *slant*  | slant  | italic          |
        | ~~gone~~ | gone   | strikethrough   |
        | `x = 1`  | x = 1  | inline code     |
        | # Title  | Title  | a heading 1     |
        | ## Part  | Part   | a heading 2     |
        | ### Bit  | Bit    | a heading 3     |
        | - item   | item   | a bulleted list |
        | 1. step  | step   | a numbered list |
        | > quoted | quoted | a quote         |
        | ```let x | let x  | a code block    |

    Scenario: A horizontal rule with Markdown
      Given a logged-in user editing an empty document
      When they type "---"
      Then the editor shows a horizontal rule

    Scenario: Linking with a shortcut
      Given a logged-in user editing a document containing "click me"
      When they select "click me" and link it to "https://example.com" with the link shortcut
      Then "click me" links to "https://example.com"

    Scenario: Undo and redo with shortcuts
      Given a logged-in user editing an empty document
      When they type "oops"
      And they undo
      Then the editor does not contain "oops"
      When they redo
      Then the editor contains "oops"

  Rule: The toolbar appears on request and teaches the shortcuts

    Scenario: The toolbar offers each format with its shortcut
      Given a logged-in user editing a document
      When they open the toolbar
      Then every format in the toolbar shows its shortcut

    Scenario: A pinned toolbar stays after a reload
      Given a logged-in user editing a document
      When they open the toolbar
      And they pin the toolbar
      And they reload the page
      Then they see the toolbar

  Rule: The counters follow the writing; resetting restarts only the speed

    Scenario: Typing counts words and speed
      Given a logged-in user editing an empty document
      When they type "three little words"
      Then the word count is 3
      And the words per minute are above 0

    Scenario: The speed drops while they are idle
      Given a logged-in user editing an empty document
      When they type "a quick burst of words"
      Then the words per minute are above 0
      When they leave the page idle for 5 minutes
      Then the words per minute have dropped

    # THE IDLE HALF HOUR IS THE POINT: a page left open drags the speed down;
    # resetting measures from now on. Words stay those in the document.
    Scenario: Resetting after a break measures the speed from now on
      Given a logged-in user editing an empty document
      When they type "before the break"
      And they leave the page idle for 30 minutes
      And they type " after"
      Then the word count is 4
      When they reset the stats
      And they type " and now fast"
      Then the word count is 7
      And the words per minute are higher than before the reset

    Scenario: Unpinned counters stay hidden after a reload
      Given a logged-in user editing a document
      When they unpin the counters
      And they reload the page
      Then they do not see the counters

  # NEGOTIABLE (plan step 6): if autosave is cut, delete this rule and fix the
  # landing's autosave claims (E9-03).
  @negotiable
  Rule: Autosave keeps up after a pause and never overwrites another tab

    Scenario: Pausing saves without asking
      Given a logged-in user editing a document
      When they type "saved by itself"
      And they pause
      Then they are told the document is saved
      When they reload the page
      Then the editor contains "saved by itself"

    Scenario: A failed autosave warns and retries on the next change
      Given a logged-in user editing a document
      And saving fails
      When they type "first try"
      And they pause
      Then they are warned the document was not saved
      When saving works again
      And they type " second try"
      And they pause
      Then they are told the document is saved

    # AUTOSAVE NEVER OVERWRITES: only an explicit save wins over a newer
    # version (ADR-0008).
    Scenario: Autosave in a stale tab holds back
      Given a logged-in user with a document open in two tabs
      When they type "from the first tab" in the first tab and save it
      And they type "from the second tab" in the second tab
      And they pause
      Then the second tab is warned the document changed elsewhere
      When they reload the first tab
      Then the first tab's editor contains "from the first tab"

  # NEGOTIABLE (plan step 6).
  @negotiable
  Rule: A tab coming back to a changed document offers to reload

    Scenario: Returning to a stale tab
      Given a logged-in user with a document open in two tabs
      When they type "from the first tab" in the first tab and save it
      And they return to the second tab
      Then the second tab is told the document changed elsewhere and offered to reload
