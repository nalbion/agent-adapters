export type Factory<O, A = any, B = A | undefined> = (arg1: A, arg2?: B) => O;
