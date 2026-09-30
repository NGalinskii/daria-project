import testFile from "@/shared/assets/json/test.json";

export type Question = {
  id: string;
  text: string;
  answers: [string, string];
};

export const testTitle = testFile.title;
export const testResult = testFile.result;
export const questions: Question[] = testFile.questions;
