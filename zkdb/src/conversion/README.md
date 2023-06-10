# Implementation of SnarkyJS to BSON

Can handle the following BSON types

- 0x01 - double 64-bit binary floating point
- 0x02 - UTF-8 string
- 0x03 - Embedded document
- 0x04 - Array
- 0x05 - Binary data
- 0x06 - Undefined (value) — Deprecated -- not Done
- 0x07 - ObjectId -- not Done
- 0x08 - Boolean "false" && "true
- 0x09 - UTC datetime
- 0x0a - Null value
- 0x0b - Regex
- 0x0d - JavaScript code -- not done
- 0x0e - Symbol. — Deprecated -- not done
- 0x0f - JavaScript code w/ scope — Deprecated -- not done
- 0x10 - 32-bit integer
- 0x11 - Timestamp-- Long
- 0x12 - 64 - bit integer
- 0x13 - 128 - bit decimal floating point -- Decimal-- not done
- 0xFF - Min Key-- not done
- 0x7f - Max key - not done

## Snarky JS Types

- 0x14 - Field - Entry point
- 0x15 - Bool
- 0x16 - Group
- 0x17 - PublicKey
- 0x18 - Int64
- 0x19 - UInt32
- 0x1a - UInt64
- 0x1b - Signature
- 0x03 - Struct - behaves like the javascript object
  
- CircuitString - Deprecated--not done
- Scalar - toFields and fromFields-- not done
- Character - Deprecated--not done
- Circuit - Deprecated-- not done
- CircuitValue - Deprecated-- not done
- AccountUpdate - toJSON and fromJSON-- not done
- Keypair - no conversion--not done
- Ledger - no conversion-- not done
- MerkleMap - only root needed-- not done
- MerkleMapWitness - tofields and fromFields-- not done
- MerkleTree - only root needed-- not done
- PrivateKey - not done
- Proof - toJSON and fromJSON-- not done
- SelfProof - toJSON and fromJSON-- not done
- Sign - toFields and fromFields-- not done
- SmartContract - not done--
- Token - not done
- VerificationKey -- not done

## Test

Run script on terminal

    bash```
        $npm run build && node build/src/conversion/bson-test.js
    ```
