import { BeforeAll, AfterAll, setDefaultTimeout } from 'cucumber';
import { adminService } from './adminService';
import { page } from './pageHelper';

setDefaultTimeout(60 * 1000);

BeforeAll({timeout: 60 * 1000}, async () => {
  await adminService.init();
  await page.init();

  // login
  await page.open(adminService.url());
  await page.type('#username', process.env.KC_USERNAME);
  await page.type('#password', process.env.KC_PWD);
  await page.clickAndNavigate('#kc-login');
});

AfterAll({timeout: 60 * 1000}, async () => {
  await adminService.destroy();
  await page.close();
  // not sure why it's not closed
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});
