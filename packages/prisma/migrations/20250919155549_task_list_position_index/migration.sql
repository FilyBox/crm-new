-- CreateIndex
CREATE INDEX "List_boardId_position_idx" ON "public"."List"("boardId", "position");

-- CreateIndex
CREATE INDEX "Task_listId_position_idx" ON "public"."Task"("listId", "position");
