import * as puppeteer from "puppeteer";
import * as fs from "fs";

export const scrapeMeyou = async (): Promise<tweet[]> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://meyou.jp/ranking/follower_voice");

  const parsedTweets = [];

  let url = UrlGenerator.generate();
  while (url) {
    await page.goto(url);

    const parsed = await page.$$eval("tr.tweet", tweets => {
      const textContentOrDefault = (
        elements: HTMLCollectionOf<Element>,
        defaultValue: string
      ): string => {
        return elements.length === 0
          ? defaultValue
          : elements[0].textContent.replace(/\n|\t/g, "");
      };
      return tweets.map(t => {
        const name = textContentOrDefault(
          t.getElementsByClassName("author-name"),
          "name undefined"
        );
        const username = textContentOrDefault(
          t.getElementsByClassName("author-username"),
          "username undefined"
        );
        const followers = textContentOrDefault(
          t.getElementsByClassName("col5"),
          "-1"
        ).replace(",", "");
        const numTweets = textContentOrDefault(
          t.getElementsByClassName("col7"),
          "-1"
        );
        return {
          name,
          username,
          followers: parseInt(followers, 10),
          tweets: parseInt(numTweets, 10)
        };
      });
    });

    parsedTweets.push(...parsed);

    url = UrlGenerator.generate();
  }

  await browser.close();
  return filterInvalidTweets(parsedTweets);
};

export interface tweet {
  name: string;
  username: string;
  followers: number;
  tweets: number;
}

export const saveTweets = (tweets: tweet[]) => {
  fs.writeFileSync("./tweets.json", JSON.stringify(tweets, null, "  "));
};

const filterInvalidTweets = (tweetsToBeFiltered: tweet[]): tweet[] => {
  return tweetsToBeFiltered.filter(t => {
    return (
      t.name !== "name undefined" &&
      t.username !== "username undefined" &&
      t.followers >= 0 &&
      t.tweets >= 0
    );
  });
};

class UrlGenerator {
  private static currentNumber = 0;
  private static urlBase = "https://meyou.jp/ranking/follower_voice";

  public static generate() {
    if (UrlGenerator.currentNumber > 350) {
      return null;
    }
    const url = `${UrlGenerator.urlBase}/${UrlGenerator.currentNumber}`;
    UrlGenerator.currentNumber = UrlGenerator.currentNumber + 50;
    return url;
  }
}
