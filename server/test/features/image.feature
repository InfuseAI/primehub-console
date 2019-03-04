# features/image.feature
Feature: Image
  In order to manage images
  As an admin
  I want to do CRUD in this UI

  Scenario: create
    Given goto "/cms/image"
    Then I should see element with test-id "image"
    When I click element with test-id "add-button" and wait for navigate
    Then the url should be "/cms/image?operator=create"
    Then I should see element with test-id "image/name"
    Then I should see element with test-id "image/displayName"
    When I type "test" to element with test-id "image/name"
    Then input in test-id "image/name" should have value "test"
    When I click element with test-id "confirm-button" and wait for navigate
    Then the url should be "/cms/image"
    Then list-view table should contain row with "test"

  Scenario: update
    Given goto "/cms/image"
    When I click edit-button in row contains text "test"
    Then I should see input in test-id "image/name" with value "test"
    # displayName will be default to name
    Then I should see input in test-id "image/displayName" with value "test"
    # type will actually append to text
    When I type "-displayName" to element with test-id "image/displayName"
    Then input in test-id "image/displayName" should have value "test-displayName"
    When I click element with test-id "confirm-button" and wait for navigate
    Then the url should be "/cms/image"
    # When I click edit-button in row contains text "test"
    # Then I should see input in test-id "image/name" with value "test"
    # Then I should see input in test-id "image/displayName" with value "test-displayName"

  Scenario: delete
    Given goto "/cms/image"
    When I delete a row with text "test"
    Then list-view table should not contain row with text "test"
    When I refresh
    Then list-view table should not contain row with text "test" 
