import { Area, City } from '@shuttle-connect/types';

// The only place that builds a GSI key. Keys are entity-type-prefixed so GSI1 can hold both
// sessions and courts in separate partitions, and GSI2 can hold both a user's hosted sessions and
// their join requests in one partition, sorted together. Index membership is controlled purely by
// whether a mapper/repository calls one of these for a given item -- never by field naming, unlike
// the table's previous semantic-key design.

export const sessionGsi1 = (city: City, district: Area, startTime: number) => ({
  GSI1PK: `SLOC#${city}#${district}`,
  GSI1SK: startTime,
});

export const courtGsi1 = (city: City, district: Area, createdAt: number) => ({
  GSI1PK: `CLOC#${city}#${district}`,
  GSI1SK: createdAt,
});

export const sessionGsi2 = (hostId: string, startTime: number) => ({
  GSI2PK: `USER#${hostId}`,
  GSI2SK: `SESSION#${startTime}`,
});

export const requestGsi2 = (userId: string, sessionStartTime: number) => ({
  GSI2PK: `USER#${userId}`,
  GSI2SK: `REQUEST#${sessionStartTime}`,
});
