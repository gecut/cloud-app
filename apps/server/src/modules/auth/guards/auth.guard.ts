import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SessionService } from "../services/session.service";
import { TokenService } from "../services/token.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        const payload = this.tokenService.verifyToken(token, "access");
        const user = await this.sessionService.validateUserSession(
          payload.sub,
          payload.tokenVersion,
        );
        request.user = user;
        return true;
      } catch (err: any) {
        if (!isPublic) {
          throw new UnauthorizedException(
            err.message || "توکن دسترسی نامعتبر است",
          );
        }
      }
    }

    if (isPublic) {
      return true;
    }

    // Dev/Demo fallback header support
    if (request.headers["x-user-id"]) {
      request.user = {
        id: request.headers["x-user-id"],
        role: request.headers["x-user-role"] || "ADMIN",
        name: "Admin User",
        phone: "09121112233",
        tokenVersion: 0,
      };
      return true;
    }

    throw new UnauthorizedException("لطفاً ابتدا وارد حساب کاربری خود شوید");
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers?.authorization;
    if (authHeader && typeof authHeader === "string") {
      const [type, token] = authHeader.split(" ");
      if (type === "Bearer" && token) {
        return token;
      }
    }

    if (request.headers?.["x-auth-token"]) {
      return request.headers["x-auth-token"];
    }

    return undefined;
  }
}
