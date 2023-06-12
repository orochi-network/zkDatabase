import { BSONDeserializer } from "./deserializer.js";
import { BSONSerializer } from "./serializer.js";


export const deserializer = new BSONDeserializer()
export const serializer = new BSONSerializer()