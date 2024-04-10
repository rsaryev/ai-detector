import OpenAI from "openai";
import { Detector, DetectorOptions } from "./types.js";

export class OpenAIDetector implements Detector {
  public openai: OpenAI;
  model: string;
  token: string | undefined;
  constructor({ model, token }: DetectorOptions = {}) {
    this.model = model || "gpt-3.5-turbo";
    this.token = token || process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({
      apiKey: this.token,
    });
  }

  public getModels() {
    return this.openai.models
      .list()
      .then((res) =>
        res.data
          .filter((model) => model.id.includes("gpt"))
          .map((model) => model.id)
      );
  }

  async detect(code: string): Promise<number> {
    const response = await this.openai.chat.completions.create({
      tools: [
        {
          type: "function",
          function: {
            name: "analyze_code",
            parameters: {
              type: "object",
              properties: {
                percent: {
                  type: "number",
                  description:
                    "The probability that the code was written by AI (in %, the higher the more likely the code was written by AI)",
                  minimum: 1,
                  maximum: 99.9,
                },
              },
              required: ["percent"],
            },
          },
        },
      ],
      messages: [{ role: "system", content: code }],
      model: this.model,
    });

    const { percent } = JSON.parse(
      response.choices[0].message.tool_calls![0].function.arguments
    );
    return percent;
  }
}
