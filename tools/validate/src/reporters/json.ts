import { Results } from "../reporter.js";

export default function (results: Results) {
  return JSON.stringify(results);
}
