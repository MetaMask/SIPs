export type Reporter = (results: Results) => string | Promise<string>;

export type Results = {
  filePath: string;
  messages: { ruleId: string; message: string; line: number; column: number }[];
}[];
