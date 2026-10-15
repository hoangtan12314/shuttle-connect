// shared/i18n: display names for backend enums (@shuttle-connect/types), ported from the design
// artifact. Keyed by the actual enum values -- not re-typed strings -- so a new Area/SkillLevel
// added to the backend shows up as a type error here instead of silently rendering nothing.
import { Area, City, SkillLevel } from '@shuttle-connect/types';

export const areaNames: Record<Area, { vi: string; en: string }> = {
  [Area.HCM_DISTRICT_1]: { vi: 'Quận 1', en: 'District 1' },
  [Area.HCM_DISTRICT_3]: { vi: 'Quận 3', en: 'District 3' },
  [Area.HCM_DISTRICT_7]: { vi: 'Quận 7', en: 'District 7' },
  [Area.HCM_DISTRICT_10]: { vi: 'Quận 10', en: 'District 10' },
  [Area.HCM_BINH_THANH]: { vi: 'Bình Thạnh', en: 'Binh Thanh' },
  [Area.HCM_PHU_NHUAN]: { vi: 'Phú Nhuận', en: 'Phu Nhuan' },
  [Area.HCM_TAN_BINH]: { vi: 'Tân Bình', en: 'Tan Binh' },
  [Area.HCM_THU_DUC]: { vi: 'Thủ Đức', en: 'Thu Duc' },
  [Area.HN_BA_DINH]: { vi: 'Ba Đình', en: 'Ba Dinh' },
  [Area.HN_HOAN_KIEM]: { vi: 'Hoàn Kiếm', en: 'Hoan Kiem' },
  [Area.HN_CAU_GIAY]: { vi: 'Cầu Giấy', en: 'Cau Giay' },
  [Area.HN_TAY_HO]: { vi: 'Tây Hồ', en: 'Tay Ho' },
  [Area.HN_HAI_BA_TRUNG]: { vi: 'Hai Bà Trưng', en: 'Hai Ba Trung' },
  [Area.DN_HAI_CHAU]: { vi: 'Hải Châu', en: 'Hai Chau' },
  [Area.DN_THANH_KHE]: { vi: 'Thanh Khê', en: 'Thanh Khe' },
  [Area.DN_SON_TRA]: { vi: 'Sơn Trà', en: 'Son Tra' },
  [Area.DN_NGU_HANH_SON]: { vi: 'Ngũ Hành Sơn', en: 'Ngu Hanh Son' },
};

export const cityNames: Record<City, { vi: string; en: string }> = {
  [City.HO_CHI_MINH]: { vi: 'TP.HCM', en: 'HCMC' },
  [City.HANOI]: { vi: 'Hà Nội', en: 'Hanoi' },
  [City.DA_NANG]: { vi: 'Đà Nẵng', en: 'Da Nang' },
};

// Short label (for pills/filters) and longer description (for the profile level picker).
export const skillLevelNames: Record<SkillLevel, { vi: string; en: string }> = {
  [SkillLevel.BEGINNER]: { vi: 'Mới chơi', en: 'Beginner' },
  [SkillLevel.NOVICE]: { vi: 'Trung bình yếu', en: 'Novice' },
  [SkillLevel.LOWER_INTERMEDIATE]: {
    vi: 'Trung bình',
    en: 'Lower intermediate',
  },
  [SkillLevel.INTERMEDIATE]: { vi: 'Trung bình khá', en: 'Intermediate' },
  [SkillLevel.UPPER_INTERMEDIATE]: { vi: 'Khá', en: 'Upper intermediate' },
};

export const skillLevelDescriptions: Record<
  SkillLevel,
  { vi: string; en: string }
> = {
  [SkillLevel.BEGINNER]: {
    vi: 'Mới cầm vợt, đánh qua lại được vài quả.',
    en: 'Just picked up a racket; can keep a short rally.',
  },
  [SkillLevel.NOVICE]: {
    vi: 'Rally ổn định, chưa có đập cầu hay bỏ nhỏ.',
    en: 'Steady rallies; no smash or drop shot yet.',
  },
  [SkillLevel.LOWER_INTERMEDIATE]: {
    vi: 'Đánh đôi được, có đập cầu cơ bản.',
    en: 'Plays doubles; has a basic smash.',
  },
  [SkillLevel.INTERMEDIATE]: {
    vi: 'Hiểu chiến thuật đánh đôi, di chuyển tốt.',
    en: 'Knows doubles tactics; moves well.',
  },
  [SkillLevel.UPPER_INTERMEDIATE]: {
    vi: 'Đánh giải phong trào, đều tay.',
    en: 'Plays local tournaments; consistent.',
  },
};
