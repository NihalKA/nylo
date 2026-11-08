import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const forbiddenFiles =
  /(?:^|\/)(?:\.env(?:\..*)?|credentials(?:\.json)?)(?:$|\/)|\.(?:p8|p12|pem|key|mobileprovision|keystore|jks)$/i;
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{30,}/,
  /sk-(?:proj-|ant-api\d+-)[A-Za-z0-9_-]{30,}/,
];
const failures = [];
for (const file of files) {
  if (forbiddenFiles.test(file) && !file.endsWith(".env.example"))
    failures.push(`${file}: credential file must not be tracked`);
  if (/\.(png|jpe?g|webp|woff2?|ttf|ico)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  if (secretPatterns.some((pattern) => pattern.test(text)))
    failures.push(`${file}: possible credential; inspect privately`);
}
if (failures.length) {
  process.stderr.write(failures.join("\n") + "\n");
  process.exit(1);
}
process.stdout.write(
  `Credential checks passed for ${files.length} tracked files.\n`,
);
