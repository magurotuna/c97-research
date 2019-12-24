import { Tweet } from "./followers/meyou";
import * as fs from "fs";

export const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

export const readTweetsJson = (jsonPath: string = "tweets.json"): Tweet[] => {
  // TODO: jsonPath にファイルがないときの判定
  const file = fs.readFileSync(jsonPath, "utf-8");
  return JSON.parse(file);
};
