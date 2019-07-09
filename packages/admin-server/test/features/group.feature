# features/group.feature
Feature: Group
  In order to manage groups
  As an admin
  I want to do CRUD in this UI

  Scenario: create
    Given goto "/cms/group"
    Then I should see element with test-id "group"
    When I click element with test-id "add-button" and wait for navigate
    Then the url should be "/cms/group?operator=create"
    Then I should see element with test-id "group/name"
    Then I should see element with test-id "group/displayName"
    When I type "test-group" to element with test-id "group/name"
    Then input in test-id "group/name" should have value "test-group"
    When I click element with test-id "confirm-button" and wait for navigate
    Then the url should be "/cms/group"
    Then list-view table should contain row with "test-group"

  Scenario: update
    Given goto "/cms/group"
    When I click edit-button in row contains text "test-group"
    Then I should see input in test-id "group/name" with value "test-group"
    When I type "test group displayName" to element with test-id "group/displayName"
    Then input in test-id "group/displayName" should have value "test group displayName"
    When I click element with test-id "confirm-button" and wait for navigate
    Then the url should be "/cms/group"
    # When I click edit-button in row contains text "test-group"
    # Then I should see input in test-id "group/name" with value "test-group"
    # Then I should see input in test-id "group/displayName" with value "test group displayName"

  Scenario: delete
    Given goto "/cms/group"
    When I delete a row with text "test-group"
    Then list-view table should not contain row with text "test-group"
    When I refresh
    Then list-view table should not contain row with text "test-group" 
