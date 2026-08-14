export enum City {
  HO_CHI_MINH = "HO_CHI_MINH",
  HANOI = "HANOI",
  DA_NANG = "DA_NANG",
}

export enum Area {
  // Ho Chi Minh City
  HCM_DISTRICT_1 = "HCM_DISTRICT_1",
  HCM_DISTRICT_3 = "HCM_DISTRICT_3",
  HCM_DISTRICT_7 = "HCM_DISTRICT_7",
  HCM_DISTRICT_10 = "HCM_DISTRICT_10",
  HCM_BINH_THANH = "HCM_BINH_THANH",
  HCM_PHU_NHUAN = "HCM_PHU_NHUAN",
  HCM_TAN_BINH = "HCM_TAN_BINH",
  HCM_THU_DUC = "HCM_THU_DUC",
  // Hanoi
  HN_BA_DINH = "HN_BA_DINH",
  HN_HOAN_KIEM = "HN_HOAN_KIEM",
  HN_CAU_GIAY = "HN_CAU_GIAY",
  HN_TAY_HO = "HN_TAY_HO",
  HN_HAI_BA_TRUNG = "HN_HAI_BA_TRUNG",
  // Da Nang
  DN_HAI_CHAU = "DN_HAI_CHAU",
  DN_THANH_KHE = "DN_THANH_KHE",
  DN_SON_TRA = "DN_SON_TRA",
  DN_NGU_HANH_SON = "DN_NGU_HANH_SON",
}

export const CITY_AREAS: Record<City, Area[]> = {
  [City.HO_CHI_MINH]: [
    Area.HCM_DISTRICT_1,
    Area.HCM_DISTRICT_3,
    Area.HCM_DISTRICT_7,
    Area.HCM_DISTRICT_10,
    Area.HCM_BINH_THANH,
    Area.HCM_PHU_NHUAN,
    Area.HCM_TAN_BINH,
    Area.HCM_THU_DUC,
  ],
  [City.HANOI]: [
    Area.HN_BA_DINH,
    Area.HN_HOAN_KIEM,
    Area.HN_CAU_GIAY,
    Area.HN_TAY_HO,
    Area.HN_HAI_BA_TRUNG,
  ],
  [City.DA_NANG]: [
    Area.DN_HAI_CHAU,
    Area.DN_THANH_KHE,
    Area.DN_SON_TRA,
    Area.DN_NGU_HANH_SON,
  ],
};
