-- Old refresh rows used opaque tokens (tokenHash); new model uses JWT with jti.
-- Cannot backfill jti from hash — clear sessions (re-login required).

DELETE FROM "RefreshToken";

DROP INDEX IF EXISTS "RefreshToken_tokenHash_key";

ALTER TABLE "RefreshToken" DROP COLUMN "tokenHash";

ALTER TABLE "RefreshToken" ADD COLUMN "jti" TEXT NOT NULL;

CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");
