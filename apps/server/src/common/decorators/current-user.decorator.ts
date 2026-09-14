import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface CurrentUserData {
  id: string;
  role: "ADMIN" | "CUSTOMER";
  customerId?: string;
  name?: string;
  phone?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData | undefined;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
