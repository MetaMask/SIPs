export const map = <P, R>(f: (_: P) => R) =>
  function* (iterable: Iterable<P>) {
    for (const x of iterable) yield f(x);
  };

export const array =
  () =>
  <P>(iterable: Iterable<P>) => {
    const result = [];
    for (const x of iterable) {
      result.push(x);
    }
    return result;
  };

// Any more complicated solutions break the Language Server
type Op<P, R> = (x: P) => R;
export function pipe<X>(x: X): X;
export function pipe<X, A>(x: X, a: Op<X, A>): A;
export function pipe<X, A, B>(x: X, a: Op<X, A>, b: Op<A, B>): B;
export function pipe<X, A, B, C>(
  x: X,
  a: Op<X, A>,
  b: Op<A, B>,
  c: Op<B, C>
): C;
export function pipe<X, A, B, C, D>(
  x: X,
  a: Op<X, A>,
  b: Op<A, B>,
  c: Op<B, C>,
  d: Op<C, D>
): D;
export function pipe<X, A, B, C, D, E>(
  x: X,
  a: Op<X, A>,
  b: Op<A, B>,
  c: Op<B, C>,
  d: Op<C, D>,
  e: Op<D, E>
): E;
export function pipe(x0: any, ...fns: Op<any, any>[]): any {
  return fns.reduce((x, f) => f(x), x0);
}
