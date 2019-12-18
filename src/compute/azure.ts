import * as fs from "fs";
import * as request from "request-promise";
import { sleep, readTweetsJson } from "../utils";
import * as cliProgress from "cli-progress";

export const computeVision = async () => {
  const tweets = readTweetsJson().map(t => t.name.replace(/\//g, ""));

  const API_URL =
    "https://japaneast.api.cognitive.microsoft.com/vision/v2.0/analyze?visualFeatures=Description&details=Celebrities&language=ja";
  const dirnames = fs.readdirSync("assets/images/");

  const results = {};

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(dirnames.length, 0);

  let count = 0;
  for (const dirname of dirnames) {
    const filenames = fs.readdirSync(`assets/images/${dirname}`);
    for (const filename of filenames) {
      const image = fs.readFileSync(`assets/images/${dirname}/${filename}`);
      const res = await request({
        url: API_URL,
        encoding: null,
        method: "POST",
        body: image,
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.API_KEY,
          Accept: "application/json",
          "Content-Type": "application/octet-stream"
        }
      }).catch(e => {
        console.error(e);
      });

      const parsed = JSON.parse(res.toString());
      console.log(parsed);
      if (dirname in results) {
        results[dirname].push(parsed);
      } else {
        results[dirname] = [parsed];
      }

      count++;
      bar.update(count);
      await sleep(5000);
    }
  }

  // 書き出し
  fs.writeFileSync("assets/compute.json", JSON.stringify(results, null, "  "));
};
