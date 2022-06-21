import { Octokit } from "@octokit/action";
import assert from "assert";
import path from "path";
import { Results } from "../reporter.js";

export default async function (results: Results) {
  const hasErrors = results.reduce(
    (acc, file) => acc || file.messages.length > 0,
    false
  );

  if (!hasErrors) {
    return "";
  }

  assert(process.env.GITHUB_TOKEN !== undefined);
  assert(process.env.GITHUB_REPOSITORY !== undefined);
  assert(process.env.GITHUB_PULL_REQUEST !== undefined);
  assert(process.env.GITHUB_SHA !== undefined);
  assert(process.env.GITHUB_WORKSPACE !== undefined);
  assert(process.env.GITHUB_SHA_PULL_REQUEST !== undefined);

  const octokit = new Octokit();

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const pull_number = Number(process.env.GITHUB_PULL_REQUEST);
  const commit_id = process.env.GITHUB_SHA_PULL_REQUEST;

  const repoDir = path.resolve(process.env.GITHUB_WORKSPACE);
  const comments = results.flatMap((file) =>
    file.messages.map((message) => ({
      path: path.relative(repoDir, file.filePath),
      line: message.line,
      body: message.message,
    }))
  );

  await octokit.request(
    "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
    {
      owner,
      repo,
      pull_number,
      commit_id,
      event: "REQUEST_CHANGES",
      body: "SIP validation failed, please see file comments for details",
      comments,
    }
  );
  return "";
}
