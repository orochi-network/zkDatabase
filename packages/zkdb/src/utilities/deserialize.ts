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

export class Deserialize {
  static decompress(input: Uint8Array): number[] {
    return [...input.slice(1), ...new Uint8Array(input[0]).fill(0)];
  }

  private static genericDeserialize<
    T extends {
      new (..._args: any[]): InstanceType<T>;
      fromFields(_fields: Field[]): InstanceType<T>;
    }
  >(obj: T, input: Uint8Array): InstanceType<T> {
    return obj.fromFields([Field.fromBytes(Deserialize.decompress(input))]);
  }

  static string(input: Uint8Array): CircuitString {
    const decompressed = Deserialize.decompress(input);
    const fields: Field[] = decompressed.map((dc) => Field.from(dc));
    return (CircuitString as any).fromFields(fields);
  }

  static character(input: Uint8Array): Character {
    return Deserialize.genericDeserialize(Character, input);
  }

  static uint32(input: Uint8Array): UInt32 {
    return Deserialize.genericDeserialize(UInt32, input);
  }

  static uint64(input: Uint8Array): UInt64 {
    return Deserialize.genericDeserialize(UInt64, input);
  }

  static int64(input: Uint8Array): Int64 {
    const sign = input[0] === 0 ? Sign.one : Sign.minusOne;
    console.log('sign', sign.isPositive().toBoolean());
    console.log(
      'decompressed',
      input.slice(1),
      Deserialize.decompress(input.slice(1))
    );
    return Int64.fromFields([
      Field.fromBytes(Deserialize.decompress(input.slice(1))),
      sign.toFields()[0],
    ]);
  }

  static bool(input: Uint8Array): Bool {
    return Deserialize.genericDeserialize(Bool, input);
  }

  static sign(input: Uint8Array): Sign {
    return Deserialize.genericDeserialize(Bool, input).toBoolean()
      ? Sign.minusOne
      : Sign.one;
  }
}
