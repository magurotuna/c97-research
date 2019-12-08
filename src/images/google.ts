import * as puppeteer from "puppeteer";
import * as fs from "fs";
import * as cliProgress from "cli-progress";
import { tweet } from "../followers/meyou";

export const fetchImages = async () => {
  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();
  const tweets = readTweetsJson();

  tweets.slice(0, 1).forEach(async tweet => {
    const url = searchUrl(tweet.name);
    console.log(`fetching ${tweet.name}...`);

    await page.goto(url, {
      waitUntil: "networkidle2"
    });
    await page.screenshot({
      path: "example.png",
      fullPage: true
    });
    const imageTabs = await page.$x(
      "//div[@id='hdtb-msb-vis']//a[text()='画像']"
    );
    await imageTabs[0].click();
    await page.waitForNavigation();

    const images = await page.$$eval("#search img", imgs => {
      return imgs
        .filter(i => {
          const src = i.getAttribute("src");
          return src !== null && src.startsWith("data:image/jpeg;base64");
        })
        .map(i => i.getAttribute("src"));
    });
  });
};

const readTweetsJson = (jsonPath: string = "tweets.json"): tweet[] => {
  // TODO: jsonPath にファイルがないときの判定
  const file = fs.readFileSync(jsonPath, "utf-8");
  return JSON.parse(file);
};

const searchUrl = (query: string) => {
  return `https://www.google.com/search?q=${query.replace(/ /g, "+")}`;
};
