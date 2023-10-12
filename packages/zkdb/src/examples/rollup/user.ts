import { Schema } from "../../core/schema.js";
import { CircuitString, UInt32 } from "o1js";

export class User extends Schema({
  accountName: CircuitString,
  ticketAmount: UInt32,
}) {
  static deserialize(data: Uint8Array): User {
    return new User(User.decode(data));
  }

  index(): { accountName: string } {
    return {
      accountName: this.accountName.toString(),
    };
  }

  json(): { accountName: string; ticketAmount: string } {
    return {
      accountName: this.accountName.toString(),
      ticketAmount: this.ticketAmount.toString(),
    };
  }
}