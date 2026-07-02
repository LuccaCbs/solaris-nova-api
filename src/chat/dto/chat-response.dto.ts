export type NovaResponseType =
  | 'message'
  | 'confirmation'
  | 'tool_result'
  | 'error';

export class ChatResponseDto {
  type: NovaResponseType;
  message: string;
  intent?: string;
  data?: unknown;
}
