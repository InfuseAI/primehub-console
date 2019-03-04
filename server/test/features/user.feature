# features/user.feature
Feature: User
  In order to manage users
  As an admin
  I want to do CRUD in this UI

  Scenario: create
    Given goto "/cms/user"
    Then I should see element with test-id "user"
    When I click element with test-id "add-button" and wait for navigate
    Then the url should be "/cms/user?operator=create"
    Then I should see element with test-id "user/username"
    Then I should see element with test-id "user/email"
    Then I should see element with test-id "user/sendEmail"
    When I type "wwwy3y3" to element with test-id "user/username"
    Then input in test-id "user/username" should have value "wwwy3y3"
    When I type "wwwy3y3@gmail.com" to element with test-id "user/email"
    Then input in test-id "user/email" should have value "wwwy3y3@gmail.com"
    When I click element with xpath "button[contains(., 'Confirm')]" and wait for navigate
    Then the url should be "/cms/user"
    Then list-view table should contain row with "wwwy3y3"

  Scenario: update
    Given goto "/cms/user"
    When I click edit-button in row contains text "wwwy3y3"
    Then I should see input in test-id "user/username" with value "wwwy3y3"
    Then I should see input in test-id "user/email" with value "wwwy3y3@gmail.com"
    When I type "William" to element with test-id "user/firstName"
    Then input in test-id "user/firstName" should have value "William"
    When I check boolean input with test-id "user/isAdmin"
    Then boolean input with test-id "user/isAdmin" should have value "true"
    When I click element with xpath "button[contains(., 'Confirm')]" and wait for navigate
    Then the url should be "/cms/user"
    When I click edit-button in row contains text "wwwy3y3"
    Then I should see input in test-id "user/username" with value "wwwy3y3"
    Then I should see input in test-id "user/email" with value "wwwy3y3@gmail.com"
    Then boolean input with test-id "user/isAdmin" should have value "true"

  Scenario: delete
    Given goto "/cms/user"
    When I delete a row with text "wwwy3y3"
    Then list-view table should not contain row with text "wwwy3y3"
    When I refresh
    Then list-view table should not contain row with text "wwwy3y3" 
