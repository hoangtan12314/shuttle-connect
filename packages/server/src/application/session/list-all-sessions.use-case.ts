import { Inject, Injectable } from "@nestjs/common";
import { SESSION_REPOSITORY, type SessionRepository } from "../../domain/session";

@Injectable()
export class ListAllSessionsUseCase {
    constructor(@Inject(SESSION_REPOSITORY) private sessionRepository: SessionRepository) { }

    async execute() {
        return await this.sessionRepository.listAll();
    }
}