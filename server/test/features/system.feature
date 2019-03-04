# features/system.feature
Feature: System
  In order to manage system
  As an admin
  I want to do update system config in this UI

  Scenario: read
    Given goto "/cms/system"
    Then I should see element with test-id "system/org/name"
    Then input in test-id "system/org/name" should have value "infuse ai"
    Then I should see element with test-id "system/org/logo"
    Then I should see element with test-id "system/defaultUserDiskQuota"
    Then I should see element with test-id "system/timezone"
    Then I should see element with test-id "system/smtp/host"
    Then I should see element with test-id "system/smtp/port"
    Then I should see element with test-id "system/smtp/fromDisplayName"
    Then I should see element with test-id "system/smtp/from"
    Then I should see element with test-id "system/smtp/replyTo"
    Then I should see element with test-id "system/smtp/replyToDisplayName"
    Then I should see element with test-id "system/smtp/envelopeFrom"
    Then I should see element with test-id "system/smtp/enableSSL"
    Then I should see element with test-id "system/smtp/enableStartTLS"
    Then I should see element with test-id "system/smtp/enableAuth"

  Scenario: update
    Given goto "/cms/system"
    # type will append to input
    When I type "-name" to element with test-id "system/org/name"
    Then input in test-id "system/org/name" should have value "infuse ai-name"
    When I click element with test-id "confirm-button"
    When I refresh
    Then input in test-id "system/org/name" should have value "infuse ai-name"
