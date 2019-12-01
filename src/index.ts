import * as puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://meyou.jp/ranking/follower_voice");
  await page.screenshot({ path: "example.png" });
  await browser.close();
})();
