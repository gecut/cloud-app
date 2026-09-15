import { RefreshTokenDto } from "./refresh-token.dto";

export class RefreshTokenCommand {
  constructor(public readonly dto: RefreshTokenDto) {}
}
