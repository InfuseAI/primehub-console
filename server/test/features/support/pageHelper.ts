import { Browser, ElementHandle, launch, Page, Response, Cookie } from 'puppeteer';
import pti from 'puppeteer-to-istanbul';
import BPromise from 'bluebird';
import imgur from 'imgur';
imgur.setClientId('cafcd0f1b01d2c2');
imgur.setMashapeKey('LFFtftBTWWmshextWvyGKqT3vUkpp1EU2g8jsniUQ6HO8oMYxv');

export class PageHelper {
  private browser: Browser;
  private page: Page;
  private readonly retryCount: number = 3;

  constructor() {
    this.browser = null;
    this.page = null;
  }

  public async init() {
    try {
      this.browser = await launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-notifications',
          '--start-maximized'
        ],
        ignoreHTTPSErrors: true,
      });
      this.page = await this.browser.newPage();
      this.page.setDefaultTimeout(10 * 1000);
      this.page.setDefaultNavigationTimeout(10 * 1000);
      await Promise.all([
        this.page.coverage.startJSCoverage(),
        this.page.coverage.startCSSCoverage(),
      ]);
      this.page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i) {
          // tslint:disable-next-line:no-console
          console.log(`[console] ${i}: ${msg.args()[i]}`);
        }
      });
      this.page.on('pageerror', err => {
        // tslint:disable-next-line:no-console
        console.log(`Page error: ${err.toString()}`);
      });
      this.page.on('error', err => {
        // tslint:disable-next-line:no-console
        console.log(`error: ${err.toString()}`);
      });
      this.page.on('requestfailed', request => {
        // tslint:disable-next-line:no-console
        console.log(`error: ${request.url()}`);
      });
      // tslint:disable-next-line:no-console
      this.page.on('load', () => console.log('[Puppeteer] frame loaded: ' + this.page.url()));
    } catch (Exception) {
      throw new Error(Exception.toString());
    }
  }

  public async open(url: string): Promise<Response> {
    return this.page.goto(url, {waitUntil: 'networkidle0'});
  }

  public async reload(): Promise<void> {
    await this.page.reload();
  }

  public async content() {
    return this.page.content();
  }

  public async getTitle(): Promise<string> {
    return this.page.title();
  }

  public async getCookies(): Promise<Cookie[]> {
    return this.page.cookies();
  }

  public getUrl(): string {
    return this.page.url();
  }

  public async clickElement(element: string): Promise<void> {
    await this.page.waitForSelector(element);
    return this.page.click(element);
  }

  public async clickAndNavigate(element: string): Promise<void> {
    await this.page.waitForSelector(element);
    await Promise.all([
      this.page.waitForNavigation({waitUntil: 'networkidle0'}), // The promise resolves after navigation has finished
      this.page.click(element), // Clicking the link will indirectly cause a navigation
    ]);
  }

  public async clickXPath(xpath: string): Promise<void> {
    await this.page.waitForXPath(xpath);
    const handlers = await this.page.$x(xpath);

    if (handlers.length > 0) {
      await handlers[0].click();
    } else {
      throw new Error(`xpath ${xpath} not found`);
    }
  }

  public async clickXPathAndNavigate(xpath: string): Promise<void> {
    await this.page.waitForXPath(xpath);
    const handlers = await this.page.$x(xpath);

    if (handlers.length > 0) {
      await Promise.all([
        this.page.waitForNavigation({waitUntil: 'networkidle0'}), // The promise resolves after navigation has finished
        handlers[0].click(), // Clicking the link will indirectly cause a navigation
      ]);
    } else {
      throw new Error(`xpath ${xpath} not found`);
    }
  }

  public async checkElementExist(element: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(element);
      return true;
    } catch (err) {
      return false;
    }
  }

  public async checkXPathElementExist(xpath: string): Promise<boolean> {
    try {
      await this.page.waitForXPath(xpath);
      return true;
    } catch (err) {
      return false;
    }
  }

  public async getValue(element: string): Promise<string> {
    try {
      await this.page.waitForSelector(element);
      const target = await this.page.$(element);
      const valueHandle = await target.getProperty('value');
      return valueHandle.jsonValue();
    } catch (err) {
      return null;
    }
  }

  public async getXPathValue(xpath: string): Promise<string> {
    try {
      await this.page.waitForXPath(xpath);
      const target = await this.page.$x(xpath);
      if (!target[0]) {
        throw new Error(`xpath ${xpath} not found`);
      }
      const valueHandle = await target[0].getProperty('value');
      return valueHandle.jsonValue();
    } catch (err) {
      return null;
    }
  }

  public async getXPathAttribute(xpath: string, attribute: string): Promise<string> {
    try {
      await this.page.waitForXPath(xpath);
      const target = await this.page.$x(xpath);
      if (!target[0]) {
        throw new Error(`xpath ${xpath} not found`);
      }

      const attributeValue = await this.page.evaluate(
        (ele, attr: string) => {
          return ele.getAttribute(attr);
        },
        target[0],
        attribute,
      );
      return attributeValue;
    } catch (err) {
      // tslint:disable-next-line:no-console
      console.log(err);
      return null;
    }
  }

  public async type(element: string, text: string): Promise<void> {
    return this.page.type(element, text);
  }

  public async screenshot(options): Promise<any> {
    return this.page.screenshot(options);
  }

  public async screenshotToImgur(): Promise<any> {
    const image = await this.page.screenshot({
      encoding: 'base64',
    });
    const res = await imgur.uploadBase64(image);
    // tslint:disable-next-line:no-console
    console.log(res.data.link);
  }

  public async close() {
    const [jsCoverage, cssCoverage] = await Promise.all([
      this.page.coverage.stopJSCoverage(),
      this.page.coverage.stopCSSCoverage(),
    ]);
    pti.write(jsCoverage);
    pti.write(cssCoverage);
    return this.browser.close();
  }
}

export const page = new PageHelper();
