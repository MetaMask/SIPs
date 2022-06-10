import assert from "assert";
import { existsSync, promises as fs } from "fs";
import process from "process";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

const argv = await yargs(hideBin(process.argv))
  .help()
  .command("$0 <file>", "", (argv) =>
    argv
      .positional("file", { describe: "The SIP to validate", type: "string" })
      .check((argv) => {
        assert(
          argv._.length === 1 && typeof argv._[0] === "string",
          "A file path required"
        );
        assert(existsSync(argv._[0]), `File at path "${argv._[0]}"`);
        return true;
      })
  ).argv;

assert(typeof argv._[0] === "string");
const file = await fs.open(argv._[0], "r");
file.createReadStream();
