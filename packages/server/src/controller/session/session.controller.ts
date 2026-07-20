import { Controller, Get } from "@nestjs/common";
import { ListAllSessionsUseCase } from "../../application/session";

@Controller('sessions')
export class SessionController {
    constructor(private readonly listAllSessionsUseCase: ListAllSessionsUseCase) { }

    @Get()
    async listSessions() {
        return await this.listAllSessionsUseCase.execute();
    }
}