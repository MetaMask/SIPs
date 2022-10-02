#!/usr/bin/env node
import assert from "assert";
import Debug from "debug";
import glob from "glob";
import process from "process";
import { read } from "to-vfile";
import { promisify } from "util";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
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
if (!filePaths.length) {
  debug("No files analyzed");
}
const files = await Promise.all(filePaths.map((path) => read(path)));
const results = await validate(files);
const isFatal = results.some((file) =>
  file.messages.some((message) => message.fatal !== null)
);

let output = "";
for (const reporter of argv.reporter) {
  output += await (reporters as any)[reporter](results);
}

if (output.length > 0) {
  process.stdout.write(`${output}\n`);
}

if (isFatal) {
  process.exit(1);
}
