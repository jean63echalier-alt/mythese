import "server-only";
import OpenAI from "openai";

export const GPT_MODEL = "gpt-4.1-mini";

let _client: OpenAI | null = null;
export function openai() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY missing");
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}
