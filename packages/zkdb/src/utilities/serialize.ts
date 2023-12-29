import {
  Bool,
  CircuitString,
  Field,
  UInt32,
  UInt64,
  Character,
  Int64,
  Sign,
} from 'o1js';

export class Serialize {
  static compress(input: Uint8Array): Uint8Array {
    let i = input.length - 1;
    let j = 0;
    for (; i > 0; i--) {
      if (input[i] !== 0) break;
      j++;
    }
    return new Uint8Array([j, ...input.slice(0, input.length - j)]);
  }

  private static toUint8Array(fields: Field[]): Uint8Array {
    return Uint8Array.from(fields.map((f) => Field.toBytes(f)).flat());
  }

  private static genericSerialize<T extends { toFields(): Field[] }>(
    input: T
  ): Uint8Array {
    return Serialize.compress(Serialize.toUint8Array(input.toFields()));
  }

  static string(input: CircuitString): Uint8Array {
    return Serialize.compress(
      Uint8Array.from(input.toFields().map((f) => Field.toBytes(f)[0]))
    );
  }

  static character(input: Character): Uint8Array {
    return Serialize.genericSerialize(input);
  }

  static uint32(input: UInt32): Uint8Array {
    return Serialize.genericSerialize(input);
  }

  static uint64(input: UInt64): Uint8Array {
    return Serialize.genericSerialize(input);
  }

  static int64(input: Int64): Uint8Array {
    return new Uint8Array([
      input.isPositive().toBoolean() ? 0 : 1,
      ...Serialize.genericSerialize(input.magnitude),
    ]);
  }

  static bool(input: Bool): Uint8Array {
    return Serialize.genericSerialize(input);
  }

  static sign(input: Sign): Uint8Array {
    // Equal -1 => Have sign mean true
    // Equal 1 => Have no sign mean false
    return Serialize.genericSerialize(input.equals(Sign.minusOne));
  }
}
