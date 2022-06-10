import chalk from "chalk";
import { Results } from "../reporter";

export default function (results: Results): string {
  let output = "";
  for (const file of results) {
    for (const message of file.messages) {
      output +=
        chalk.bold(
          chalk.red(`error[${message.ruleId}]`) + `: ${message.message}`
        ) + "\n";
      output += `  -> ${file.filePath}:${message.line}:${message.column}\n\n`;
    }
  }
  return output;
}
