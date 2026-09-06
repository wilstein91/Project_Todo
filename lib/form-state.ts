/**
 * 폼 액션의 상태 타입과 초기값.
 *
 * "use server" 파일은 async 함수만 export 할 수 있으므로
 * (invalid-use-server-value 오류) 상수는 이 파일에 둔다.
 */

export type CreateState = {
  ok: boolean;
  error: string | null;
  /** 성공 시마다 증가한다. 클라이언트에서 폼 초기화 시점을 잡는 데 쓴다. */
  submitCount: number;
};

export const initialCreateState: CreateState = {
  ok: false,
  error: null,
  submitCount: 0,
};

/** 로그인·계정 생성처럼 오류 메시지만 필요한 폼의 공용 상태 */
export type FormState = {
  ok: boolean;
  error: string | null;
  message: string | null;
  submitCount: number;
};

export const initialFormState: FormState = {
  ok: false,
  error: null,
  message: null,
  submitCount: 0,
};
