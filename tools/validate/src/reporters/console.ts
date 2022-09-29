import chalk from "chalk";
import { VFile } from "vfile";

const reporter = (files: VFile[]) => {
  let output = "";
  for (const file of files) {
    for (const message of file.messages) {
      output +=
        chalk.bold(
          chalk.red(`error`) +
            `: ${message.reason} ` +
            chalk.gray(`(${message.source}:${message.ruleId})`)
        ) + "\n";
      output += `  ➜ ${file.path}`;
      if (message.line !== null) {
        output += `:${message.line}`;
        if (message.column !== null) {
          output += `:${message.column}`;
        }
      }
      output += "\n\n";
    }
  }
  return output.slice(undefined, -2); // remove last '\n\n'
};

export default reporter;
