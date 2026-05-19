import { publicProcedure } from "../index";

export const publicRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
};
