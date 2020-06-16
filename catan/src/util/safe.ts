export function makeSafeFunction<F extends (...args: any) => any, T extends ReturnType<F>, P extends Parameters<F>>
(fn: F, ...fail: T extends void ? [undefined?] : [T]): (...args: P) => T {
  return (...args) => {
    return safeCall(fn, args, ...fail);
  };
}

export function safeCall<F extends (...args: any) => any, T extends ReturnType<F>>
(fn: F, args: Parameters<F>, ...fail: T extends void ? [undefined?] : [T]): T {
  try {
    return fn(args);
  } catch (err) {
    return fail[0]!;
  }
}