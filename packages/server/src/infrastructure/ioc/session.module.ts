import { Module } from "@nestjs/common";
import { SessionController } from "../../controller/session";
import { ListAllSessionsUseCase } from "../../application/session";
import { SESSION_REPOSITORY } from "../../domain/session";
import { SessionRepositoryDynamoDB } from "../dynamodb";

@Module({
    controllers: [SessionController],
    providers: [
        ListAllSessionsUseCase,
        { provide: SESSION_REPOSITORY, useClass: SessionRepositoryDynamoDB },
    ]
})
export class SessionModule { }


