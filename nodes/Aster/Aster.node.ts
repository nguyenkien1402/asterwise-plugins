import { NodeConnectionTypes, NodeOperationError } from "n8n-workflow";
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

const endpoint = "https://api.asterwise.dev/v1/chat/completions";
const errors: Record<number, string> = {
  400: "Aster rejected the request. Check the prompt and output limit.",
  401: "Aster API key is invalid or revoked. Update the Aster credential.",
  402: "Aster balance is insufficient. Add funds before running again.",
  403: "Aster denied access. Check account permissions or billing review.",
  429: "Aster daily or concurrency limit reached. Check limits before running again.",
  503: "Aster is temporarily unavailable. Try again later.",
};
function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const value = error as {
    statusCode?: unknown;
    httpCode?: unknown;
    response?: { status?: unknown };
  };
  const status = Number(
    value.statusCode ?? value.httpCode ?? value.response?.status,
  );
  return Number.isInteger(status) && status >= 100 && status <= 599
    ? status
    : undefined;
}

export class Aster implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Aster",
    name: "aster",
    icon: { light: "file:aster.svg", dark: "file:aster.svg" },
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: "Generate text with Aster Work",
    usableAsTool: true,
    defaults: { name: "Aster" },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: "asterApi", required: true }],
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Generate Text",
            value: "generateText",
            action: "Generate text",
            description: "Generate text with Aster Work",
          },
        ],
        default: "generateText",
      },
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string",
        typeOptions: { rows: 4 },
        default: "",
        required: true,
        description: "Text to send to Aster Work",
      },
      {
        displayName: "System Instruction",
        name: "systemInstruction",
        type: "string",
        typeOptions: { rows: 3 },
        default: "",
        description: "Optional instruction sent before the prompt",
      },
      {
        displayName: "Maximum Output Tokens",
        name: "maxTokens",
        type: "number",
        typeOptions: { minValue: 1, maxValue: 4096, numberPrecision: 0 },
        default: 1024,
        description:
          "Output token cap, including reasoning tokens when applicable",
      },
    ],
  };
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const output: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
      try {
        const prompt = this.getNodeParameter("prompt", i) as string;
        const system = this.getNodeParameter("systemInstruction", i) as string;
        const maxTokens = this.getNodeParameter("maxTokens", i) as number;
        if (this.getNodeParameter("operation", i) !== "generateText")
          throw new NodeOperationError(
            this.getNode(),
            "Unsupported operation",
            { itemIndex: i },
          );
        if (
          typeof prompt !== "string" ||
          !prompt.trim() ||
          prompt.length > 100000 ||
          typeof system !== "string" ||
          system.length > 100000
        ) {
          throw new NodeOperationError(
            this.getNode(),
            "Provide a nonempty prompt; each text field is limited to 100,000 characters.",
            { itemIndex: i },
          );
        }
        if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4096)
          throw new NodeOperationError(
            this.getNode(),
            "Maximum Output Tokens must be an integer from 1 to 4096.",
            { itemIndex: i },
          );
        const messages = [
          ...(system.trim() ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ];
        const response = await this.helpers.httpRequestWithAuthentication.call(
          this,
          "asterApi",
          {
            method: "POST",
            url: endpoint,
            body: {
              model: "aster-work",
              messages,
              max_tokens: maxTokens,
              stream: false,
            },
            json: true,
            timeout: 300000,
          },
        );
        const choice = response?.choices?.[0];
        if (typeof choice?.message?.content !== "string")
          throw new NodeOperationError(
            this.getNode(),
            "Aster returned no text content. Check the output limit before running again.",
            { itemIndex: i },
          );
        output.push({
          json: {
            text: choice.message.content,
            model: "aster-work",
            finishReason: choice.finish_reason ?? null,
            usage: response.usage ?? null,
            id: response.id ?? null,
          },
          pairedItem: { item: i },
        });
      } catch (error) {
        const status = statusOf(error);
        // Never forward transport errors: they can contain the authorization header or request text.
        const safeError =
          error instanceof NodeOperationError
            ? error
            : new NodeOperationError(
                this.getNode(),
                status
                  ? (errors[status] ??
                    "Aster request failed. Check service status before running again.")
                  : "Aster request could not complete. Check connectivity and usage before retrying.",
                {
                  itemIndex: i,
                  description: status ? `HTTP ${status}` : undefined,
                },
              );
        if (!this.continueOnFail()) throw safeError;
        output.push({
          json: {
            error: safeError.message,
            ...(status ? { statusCode: status } : {}),
          },
          pairedItem: { item: i },
        });
      }
    }
    return [output];
  }
}
