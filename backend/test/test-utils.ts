import type { ErrorResponse } from '../src/types/error'

export type ApiSuccessResponse<T = unknown> = {
  data: T
}

export async function parseApiResponse<T = unknown>(
  response: Response
): Promise<ErrorResponse | ApiSuccessResponse<T>> {
  return response.json() as Promise<ErrorResponse | ApiSuccessResponse<T>>
}
