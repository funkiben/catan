import {Set} from "immutable";
import {safeCall} from "./safe";

export interface ObserverManager<T extends Object> {
  readonly observers: Set<T>;

  addObserver(o: T): void;

  removeObserver(o: T): void;

  call<F extends (...args: any) => void>(fn: (observer: T) => F, ...args: Parameters<F>): void;
}

export function makeObserverManager<T extends Object>(observers: Set<T> = Set()): ObserverManager<T> {
  return {
    observers,
    addObserver: o => observers = observers.add(o),
    removeObserver: o => observers = observers.remove(o),
    call: (fn, args) => observers.forEach(o => safeCall(fn(o), args))
    // call: fn => observers.forEach(o => safeCall(fn, [o]))
  }
}