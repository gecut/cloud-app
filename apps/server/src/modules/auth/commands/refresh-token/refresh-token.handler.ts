import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UnauthorizedException } from "@nestjs/common";
import { SessionService } from "../../services/session.service";
import { TokenService } from "../../services/token.service";
import { AuthTokens } from "../../types/authenticated-user.type";
import { RefreshTokenCommand } from "./refresh-token.command";

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand, { success: boolean; tokens: AuthTokens }> {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(command: RefreshTokenCommand) {
    const { refreshToken } = command.dto;

    const payload = this.tokenService.verifyToken(refreshToken, "refresh");
    const user = await this.sessionService.validateUserSession(
      payload.sub,
      payload.tokenVersion,
    );

    // Validate DB session
    await this.sessionService.validateRefreshTokenSession(refreshToken).catch((err) => {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
    });

    // Invalidate consumed refresh token
    await this.sessionService.removeSessionByRefreshToken(refreshToken).catch(() => {});

    // Generate new pair of tokens (preserve 2-minute expiration for OTP login)
    const isOtp = payload.loginMethod === "otp";
    const tokens = this.tokenService.generateAuthTokens(
      user,
      isOtp ? 120 : undefined,
      undefined,
      isOtp ? "otp" : undefined,
    );

    // Persist new session
    const refreshDays = user.role === "ADMIN" ? 7 : 30;
    const refreshTokenExpiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
    await this.sessionService
      .createSession(user.id, tokens.refreshToken, refreshTokenExpiresAt)
      .catch((err) => {
        console.error("Failed to persist refreshed session in DB:", err);
      });

    return {
      success: true,
      tokens,
    };
  }
}
