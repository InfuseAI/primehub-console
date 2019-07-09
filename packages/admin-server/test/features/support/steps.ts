// tslint:disable:no-unused-expression
import { Given, When, Then } from 'cucumber';
import { expect } from 'chai';
import { page } from './pageHelper';
import { adminService } from './adminService';
import BPromise from 'bluebird';

const testIdToSelector = (testId: string) => `[data-testid="${testId}"]`;

Given('goto {string}', async (path: string) => {
  const url = adminService.url(path);
  await page.open(url);
});

// When

When('I refresh', async () => {
  await page.reload();
});

When('I click element with test-id {string}', async (testId: string) => {
  await page.clickElement(testIdToSelector(testId));
});

When('I click element with test-id {string} and wait for navigate', async (testId: string) => {
  await page.clickAndNavigate(testIdToSelector(testId));
});

When('I click element with xpath {string}', async (xpath: string) => {
  await page.clickXPath(`//${xpath}`);
});

When('I click element with xpath {string} and wait for navigate', async (xpath: string) => {
  await page.clickXPathAndNavigate(`//${xpath}`);
});

When('I type {string} to element with test-id {string}', async (text: string, testId: string) => {
  await page.type(`${testIdToSelector(testId)} input`, text);
});

When('I click edit-button in row contains text {string}', {timeout: 60 * 1000}, async (text: string) => {
  // use xpath to find the <tr> containing 'text', then edit button
  // xpath: //tr[contains(., 'hlb')]//button[@data-testid='edit-button']
  const xpath = `//tr[contains(., '${text}')]//button[@data-testid='edit-button']`;
  await page.clickXPathAndNavigate(xpath);
});

When('I delete a row with text {string}', async (text: string) => {
  // use xpath to find the <tr> containing 'text', then edit button
  // xpath: //tr[contains(., 'hlb')]//button[@data-testid='edit-button']
  const xpath = `//tr[contains(., '${text}')]//button[@data-testid='delete-button']`;
  await page.clickXPath(xpath);
  // wait for animation end
  await BPromise.delay(300);

  // press OK button in popup
  const okButtonXPath = `//button[contains(., 'OK')]`;
  await page.clickXPath(okButtonXPath);
  await BPromise.delay(300);
});

When('I check boolean input with test-id {string}', async (testId: string) => {
  // the boolean checkbox we use is a <button>
  const xpath = `//*[@data-testid='${testId}']//button`;
  await page.clickXPath(xpath);
  await BPromise.delay(100);
});

// Then

Then('I should see element with test-id {string}', async (testId: string) => {
  const exists = await page.checkElementExist(testIdToSelector(testId));
  expect(exists).to.be.true;
});

Then('the url should be {string}', async (path: string) => {
  const url = adminService.url(path);
  expect(page.getUrl()).to.equal(url);
});

Then('input in test-id {string} should have value {string}', async (testId: string, value: string) => {
  const inputSelector = `${testIdToSelector(testId)} input`;
  const inputValue = await page.getValue(inputSelector);
  expect(inputValue).to.equal(value);
});

Then('list-view table should contain row with {string}', async (text: string) => {
  // use xpath to find the <tr> containing 'text'
  const xpath = `//tr[contains(., '${text}')]`;
  const exists = await page.checkXPathElementExist(xpath);
  expect(exists).to.be.true;
});

Then('list-view table should not contain row with text {string}', {timeout: 60 * 1000}, async (text: string) => {
  // use xpath to find the <tr> containing 'text'
  const xpath = `//tr[contains(., '${text}')]`;
  const exists = await page.checkXPathElementExist(xpath);
  expect(exists).to.be.false;
});

Then('I should see input in test-id {string} with value {string}', async (testId: string, value: string) => {
  // xpath: //*[@data-testid='user/username']//input
  const xpath = `//*[@data-testid='${testId}']//input`;
  const inputValue = await page.getXPathValue(xpath);
  expect(inputValue).to.equal(value);
});

Then('boolean input with test-id {string} should have value {string}', async (testId: string, rawValue: string) => {
  // the boolean checkbox we use is a <button>
  const xpath = `//*[@data-testid='${testId}']//button`;
  const value = (rawValue === 'true');
  const rawInputValue = await page.getXPathAttribute(xpath, 'aria-checked');
  const inputValue = (rawInputValue === 'true');
  expect(inputValue).to.equal(value);
});
