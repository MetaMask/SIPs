import chalk from "chalk";
import { Results } from "../reporter.js";
import { enumerate } from "../utils.js";

export default function (results: Results): string {
  let output = "";
  for (const file of results) {
    for (const [i, message] of enumerate(file.messages)) {
      output +=
        chalk.bold(
          chalk.red(`error`) +
            `: ${message.message} ` +
            chalk.gray(`(${message.ruleId})`)
        ) + "\n";
      output += `  ➜ ${file.filePath}:${message.line}:${message.column}`;
      if (i !== results.length - 1) {
        output += "\n\n";
      }
    }
  }
  return output;
}
