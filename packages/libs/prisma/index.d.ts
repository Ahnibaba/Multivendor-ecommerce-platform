import { PrismaClient } from "@prisma/client";
declare global {
    namespace globalThis {
        var prismadb: PrismaClient;
    }
}
declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
//# sourceMappingURL=index.d.ts.map