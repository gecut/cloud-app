import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { SessionService } from "../../services/session.service";
import { AuthenticatedUser } from "../../types/authenticated-user.type";
import { GetMeQuery } from "./get-me.query";

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery, { success: boolean; user: AuthenticatedUser }> {
  constructor(private readonly sessionService: SessionService) {}

  async execute(query: GetMeQuery) {
    const user = await this.sessionService.getUserProfile(query.userId);

    return {
      success: true,
      user,
    };
  }
}
