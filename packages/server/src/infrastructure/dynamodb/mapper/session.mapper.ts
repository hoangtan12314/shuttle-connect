import { Session } from '../../../domain/session';



export class SessionMapper {
  static toPersistence(session: Session): Record<string, any> {
    const data = session.toJSON();
    return {
      PK: `SESSION#${data.id}`,
      SK: 'META',
      court_id: data.courtId,
      user_id: data.hostId,
      start_time: data.startTime.getTime(),
      end_time: data.endTime.getTime(),
      slots_remaining: data.slotsRemaining,
      slots_total: data.slotsTotal,
      status: data.status,
      price_male: data.priceMale,
      price_female: data.priceFemale,
      shuttle_type: data.shuttleType,
      min_skill_level: data.minSkillLevel,
      description: data.description,
      created_at: data.createdAt.getTime()
    };
  }

  static fromPersistence() {

  }
}
