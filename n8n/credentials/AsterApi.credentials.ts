import type {
  IAuthenticateGeneric,
  ICredentialType,
  ICredentialTestRequest,
  Icon,
  INodeProperties,
} from "n8n-workflow";

export class AsterApi implements ICredentialType {
  name = "asterApi";
  displayName = "Aster API";
  icon: Icon = {
    light: "file:../nodes/Aster/aster.svg",
    dark: "file:../nodes/Aster/aster.svg",
  };
  test: ICredentialTestRequest = {
    request: {
      baseURL: "https://api.asterwise.dev",
      url: "/v1/models",
      method: "GET",
    },
  };
  documentationUrl = "https://docs.asterwise.dev/api/chat-completions";
  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
    },
  ];
  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: { Authorization: "=Bearer {{$credentials.apiKey}}" },
    },
  };
}
