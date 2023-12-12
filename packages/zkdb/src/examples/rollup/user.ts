import { Schema } from "../../core/schema.js";
import { Field } from "o1js";
export class User extends Schema({
  accountName: Field,
  ticketAmount: Field,
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