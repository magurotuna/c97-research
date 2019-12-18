import * as fs from "fs";
import { Tweet } from "../followers/meyou";
import * as csv from "csv";

export default async () => {
  const resultsPromise = readFilePromise("assets/compute.json");
  const tweetsPromise = readFilePromise("tweets.json");

  const [results, tweets] = await Promise.all([
    resultsPromise,
    tweetsPromise
  ]).then(([rawR, rawT]) => [JSON.parse(rawR), JSON.parse(rawT)]);

  const summary: Summary[] = [];

  for (const key of Object.keys(results)) {
    const resultsPerPerson = results[key];
    const formattedKey = normalizeName(key);

    let total = 0;
    let successCount = 0;
    for (const result of resultsPerPerson) {
      const categories = result.categories;

      // 「人」がカテゴリ名に含まれない場合、顔が写った写真でない可能性が高いのでスルーする
      if (!categories?.some(cat => cat.name.includes("人"))) {
        continue;
      }

      total++;

      const isSuccess = categories.some(
        cat =>
          cat.name.includes("人") &&
          cat.detail?.celebrities.some(cel => {
            const inc = formattedKey.includes(cel.name.replace(/\s/g, ""));
            return inc;
          })
      );
      if (isSuccess) {
        successCount++;
      }
    }

    summary.push({
      name: formattedKey.replace("official", "").replace("staff", ""),
      probability: total === 0 ? -1 : (successCount * 100) / total,
      total: total,
      success: successCount,
      numFollowers: getFollowersNum(formattedKey, tweets as Tweet[])
    });
  }

  summary.sort((a, b) => b.probability - a.probability);

  csv.stringify(summary, { header: true }, (err, output) => {
    if (err) {
      console.error(err);
    } else {
      fs.writeFileSync("assets/results.csv", output);
    }
  });
};

const readFilePromise = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf8" }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const normalizeName = (name: string) =>
  name
    .replace(/\s/g, "")
    .replace(/\//g, "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 65248)
    );

const getFollowersNum = (normalizedName: string, tweets: Tweet[]) => {
  return tweets.find(t => normalizeName(t.name) === normalizedName)?.followers;
};

interface Summary {
  name: string;
  probability: number;
  total: number;
  success: number;
  numFollowers?: number;
}
