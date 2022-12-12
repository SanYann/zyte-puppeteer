import { APIGatewayProxyEvent } from "aws-lambda";
import { config } from "dotenv";
import wait from "promisify-wait";
import puppeteer from "puppeteer-extra";
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import SmartProxyPlugin from "zyte-smartproxy-plugin";
config();

const chromium = require("chrome-aws-lambda");

const { API_KEY } = process.env;

puppeteer
  .use(
    SmartProxyPlugin({
      spm_apikey: API_KEY,
      static_bypass: false,
      headers: {
        "X-Crawlera-No-Bancheck": "1",
        "X-Crawlera-Profile": "desktop",
        "X-Crawlera-Cookies": "disable",
      },
    })
  )
  .use(StealthPlugin())
  .use(
    AdBlockerPlugin({
      blockTrackers: true,
    })
  );

export const postHandler = async (
  event: APIGatewayProxyEvent
): Promise<void> => {
  const body = JSON.parse(event.body);

  await wait(2000);
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    timeout: 80000,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [...chromium.args, "--disable-notifications"],
  });

  const page = await browser.newPage();

  await page.goto(body.url, { timeout: 180000 });

  await page.screenshot({ path: "screenshot.png" });
  await browser.close();
};
