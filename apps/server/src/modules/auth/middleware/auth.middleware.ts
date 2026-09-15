import { Injectable, NestMiddleware } from "@nestjs/common";
import { SessionService } from "../services/session.service";
import { TokenService } from "../services/token.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async use(req: any, _res: any, next: () => void) {
    const authHeader = req.headers?.authorization;
    let token: string | undefined;

    if (authHeader && typeof authHeader === "string") {
      const [type, t] = authHeader.split(" ");
      if (type === "Bearer" && t) {
        token = t;
      }
    } else if (req.headers?.["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    if (token) {
      try {
        const payload = this.tokenService.verifyToken(token, "access");
        const user = await this.sessionService.validateUserSession(
          payload.sub,
          payload.tokenVersion,
        );
        req.user = user;
      } catch {
        // Continue without populating req.user
      }
    }

    next();
  }
}
