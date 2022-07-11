#!/usr/bin/env node
import assert from "assert";
import Debug from "debug";
import { promises as fs } from "fs";
import glob from "glob";
import process from "process";
import { promisify } from "util";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { Reporter, Results } from "./reporter.js";
import * as reporters from "./reporters/index.js";
import { validate } from "./validate.js";

const debug = Debug("validate:main");

const globAsync = promisify(glob);

const argv = await yargs(hideBin(process.argv))
  .help()
  .version()
  .command("$0 <glob>", "", (argv) =>
    argv
      .positional("glob", {
        describe: "Filepath of SIP or glob pattern of files to validate",
        type: "string",
      })
      .demandOption("glob")
      .option("reporter", {
        choices: Object.keys(reporters),
        array: true,
        describe: "One or more reporters used to print out results",
        default: ["console"],
      })
      .coerce("glob", (arg) => globAsync(arg, { nodir: true }))
  ).argv;

assert(argv.glob !== undefined);
const filePaths: string[] = argv.glob as unknown as string[]; // Typescript types fail here

const results: Results = [];

let errorCount = 0;

for (const filePath of filePaths) {
  debug(`Validating ${filePath}`);
  const file = await fs.open(filePath, "r");
  try {
    const messages = await validate({
      data: await file.readFile(),
      path: filePath,
    });
    debug(`${filePath} message count: ${messages.length}`);
    errorCount += messages.length;
    results.push({ filePath, messages });
  } finally {
    await file.close();
  }
}

let output = "";
for (const reporter of argv.reporter) {
  output += await ((reporters as any)[reporter] as Reporter)(results);
}

if (output.length > 0) {
  process.stdout.write(`${output}\n`);
}

if (errorCount > 0) {
  process.exit(1);
}
