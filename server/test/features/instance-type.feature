# features/instance-type.feature
Feature: InstanceType
  In order to manage instance-types
  As an admin
  I want to do CRUD in this UI

  Scenario: create
    Given goto "/cms/instanceType"
    Then I should see element with test-id "instanceType"
    When I click element with test-id "add-button" and wait for navigate
    Then the url should be "/cms/instanceType?operator=create"
    Then I should see element with test-id "instanceType/name"
    Then I should see element with test-id "instanceType/displayName"
    When I type "test-instance-type" to element with test-id "instanceType/name"
    Then input in test-id "instanceType/name" should have value "test-instance-type"
    When I click element with test-id "confirm-button" and wait for navigate
    Then the url should be "/cms/instanceType"
    Then list-view table should contain row with "test-instance-type"

  Scenario: update
    Given goto "/cms/instanceType"
    When I click edit-button in row contains text "test-instance-type"
    Then I should see input in test-id "instanceType/name" with value "test-instance-type"
    # displayName will be default to name
    Then I should see input in test-id "instanceType/displayName" with value "test-instance-type"
    # type will actually append to text
    When I type "-displayName" to element with test-id "instanceType/displayName"
    Then input in test-id "instanceType/displayName" should have value "test-instance-type-displayName"
    When I click element with test-id "confirm-button" and wait for navigate
    Then the url should be "/cms/instanceType"
    # When I click edit-button in row contains text "test-instance-type"
    # Then I should see input in test-id "instanceType/name" with value "test-instance-type"
    # Then I should see input in test-id "instanceType/displayName" with value "test-instance-type-displayName"

  Scenario: delete
    Given goto "/cms/instanceType"
    When I delete a row with text "test-instance-type"
    Then list-view table should not contain row with text "test-instance-type"
    When I refresh
    Then list-view table should not contain row with text "test-instance-type" 
