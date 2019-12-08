import { scrapeMeyou, saveTweets } from "./followers/meyou";
import { fetchImages } from "./images/google";

const main = async () => {
  if (
    process.argv.length < 3 ||
    !["scrape", "images", "compute"].includes(process.argv[2])
  ) {
    console.error(
      "You should run `yarn scrape` or `yarn images` or `yarn compute`."
    );
    return;
  }

  switch (process.argv[2]) {
    case "scrape": {
      const res = await scrapeMeyou();
      saveTweets(res);
      return;
    }
    case "images": {
      await fetchImages();
      return;
    }
    case "compute": {
      return;
    }
    default: {
      console.error("Unknown error happened.");
      return;
    }
  }
};

try {
  main();
} catch (e) {
  console.error(e);
}
