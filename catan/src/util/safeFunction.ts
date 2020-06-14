export function makeFunctionsSafe<T extends Object>(obj: T): T {
  const newObj: T = {...obj};
  for (const key of Object.keys(obj)) {
    if (typeof key === 'function') {
      // @ts-ignore
      newObj[key] = safeFunction(obj[key]);
    }
  }
  return <T>newObj;
}

export function safeFunction<F extends (...args: any) => any,
    T extends ReturnType<F>,
    P extends Parameters<F>>
(fn: F, fail?: T): (...args: P) => T {
  return (fn, args) => {
    try {
      return fn(args);
    } catch (err) {
      return fail!;
    }
  };
}