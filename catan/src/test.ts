interface A {
  foo(n: number, a: string): boolean;

  bar(): void;
}

type Test<T, K extends keyof T> = {
  [P in K]: T[P] extends (...args: any) => any ? (...args: Parameters<T[P]>) => void : never;
}