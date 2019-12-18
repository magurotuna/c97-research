import * as puppeteer from "puppeteer";
import * as fs from "fs";
import * as cliProgress from "cli-progress";
import { Tweet } from "../followers/meyou";
import * as makeDir from "make-dir";
import * as request from "request";
import { sleep } from "../utils";
import { readTweetsJson } from "../utils";

export const fetchImages = async (useG = false) => {
  await makeDir("assets/images");

  const browser = await puppeteer.launch({
    headless: false
  });
  const page = await browser.newPage();
  const tweets = readTweetsJson();

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(tweets.length, 0);

  let count = 0;
  for (const tweet of tweets) {
    if (useG) {
      await searchG(tweet, page);
    } else {
      await searchY(tweet, page);
    }
    count++;
    bar.update(count);
  }
  bar.stop();
};

const searchY = async (tweet: Tweet, page: puppeteer.Page) => {
  const url = searchUrlY(`"${tweet.name}" 画像`);
  console.log(`fetching ${tweet.name}...`);

  await page.goto(url, {
    waitUntil: "networkidle2"
  });

  const images = await page.$$eval("#gridlist p.tb img", imgs => {
    return imgs
      .filter(i => {
        const src = i.getAttribute("src");
        return src !== null;
      })
      .slice(0, 5)
      .map(i => i.getAttribute("src"));
  });

  const replacedName = tweet.name.replace(/\//g, "");
  const dirPath = `assets/images/${replacedName}`;
  await makeDir(dirPath);
  for (let i = 0; i < images.length; i++) {
    const filename = `${replacedName}_${i}.jpg`;
    // 画像をfetch
    request.get(
      images[i],
      {
        encoding: null
      },
      (err, _, body) => {
        if (err) {
          console.error(err);
        } else {
          // save
          fs.writeFile(`${dirPath}/${filename}`, Buffer.from(body), err => {
            if (err) {
              console.error(err);
            } else {
              console.log(`${filename} has been saved!`);
            }
          });
        }
      }
    );
  }

  await sleep(5000 * Math.random());
};

const searchG = async (tweet: Tweet, page: puppeteer.Page) => {
  const url = searchUrl(`"${tweet.name}" 画像`);

  await page.goto(url, {
    waitUntil: "networkidle2"
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
      .slice(0, 5)
      .map(i => i.getAttribute("src").replace(/^data:\w+\/\w+;base64,/, ""));
  });

  const replacedName = tweet.name.replace(/\//g, "");
  const dirPath = `assets/images/${replacedName}`;
  await makeDir(dirPath);
  for (let i = 0; i < images.length; i++) {
    const filename = `${replacedName}_${i}.jpg`;
    fs.writeFile(
      `${dirPath}/${filename}`,
      Buffer.from(images[i], "base64"),
      err => {
        if (err) {
          console.error(err);
        } else {
          console.log(`${filename} has been saved!`);
        }
      }
    );
  }

  await sleep(4000 * Math.random());
};

const searchUrl = (query: string) => {
  return `https://www.google.com/search?q=${query.replace(/ /g, "+")}`;
};

const searchUrlY = (query: string) => {
  return `https://search.yahoo.co.jp/image/search?p=${query.replace(
    / /g,
    "+"
  )}&dim=large`;
};
