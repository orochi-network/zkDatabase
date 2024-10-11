import { Mina } from 'o1js';

export type MinaTransaction = Awaited<ReturnType<typeof Mina.transaction>>;
