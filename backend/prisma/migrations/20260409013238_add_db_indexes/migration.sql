-- DropIndex
DROP INDEX "TrainSchedule_routeId_idx";

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Route_name_idx" ON "Route"("name");

-- CreateIndex
CREATE INDEX "Station_name_idx" ON "Station"("name");

-- CreateIndex
CREATE INDEX "TrainSchedule_routeId_departureAt_idx" ON "TrainSchedule"("routeId", "departureAt");

-- CreateIndex
CREATE INDEX "TrainSchedule_trainType_idx" ON "TrainSchedule"("trainType");
