import { readFileSync, writeFileSync } from "node:fs";
const number = process.argv[2];
if (!/^\d{1,9}$/.test(number || ""))
  throw new Error("A positive numeric CI build number is required.");
const value = JSON.parse(readFileSync("app.json", "utf8"));
value.expo.ios.buildNumber = number;
writeFileSync("app.json", JSON.stringify(value, null, 2) + "\n");
