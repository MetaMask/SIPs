export type Reporter = (results: Results) => string | Promise<string>;

export type Message = {
  ruleId: string;
  message: string;
  line: number;
  column: number;
};

export type Results = {
  filePath: string;
  messages: Message[];
}[];
