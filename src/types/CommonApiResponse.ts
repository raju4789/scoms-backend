// types/CommonApiResponse.ts

export interface ErrorDetails {
  errorCode: number;
  errorMessage: string;
}

export interface CommonApiResponse<T> {
  isSuccess: boolean;
  data: T | null;
  errorDetails: ErrorDetails | null;
}

export const successResponse = <T>(data: T): CommonApiResponse<T> => ({
  isSuccess: true,
  data,
  errorDetails: null,
});

export const errorResponse = (
  errorCode: number,
  errorMessage: string,
): CommonApiResponse<null> => ({
  isSuccess: false,
  data: null,
  errorDetails: { errorCode, errorMessage },
});
