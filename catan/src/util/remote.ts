export type MessageSerializer<T> = {
  [P in keyof T]:
  T[P] extends (...args: infer P) => any
      ? (...args: P) => string
      : never;
}

export type ResponseDeserializer<T> =  {
  [P in keyof T]:
  T[P] extends (...args: any) => Promise<infer R> | infer R
      ? (R extends void ? never : (response: string) => R)
      : never;
};

export type WriteFn = (msg: any) => void;
export type ReadFn = () => Promise<string>;
