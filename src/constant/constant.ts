export enum CATEGORYTYPE {
  DINNINGOUT = "DINNINGOUT",
  ENTERTAINMENT = "ENTERTAINMENT",
  GENERAL_BUSINESS = "GENERAL_BUSINESS",
  MANUFACTURING = "MANUFACTURING",
  OFFICES = "OFFICES",
  PERSONAL = "PERSONAL",
  PURCHASING = "PURCHASING",
  TECHNOLOGY = "TECHNOLOGY",
  TRAVEL = "TRAVEL",
}

export const CategoryTypeList: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: CATEGORYTYPE.DINNINGOUT, label: "Dinning Out" },
  { value: CATEGORYTYPE.ENTERTAINMENT, label: "Entertainment" },
  { value: CATEGORYTYPE.GENERAL_BUSINESS, label: "General Business" },
  { value: CATEGORYTYPE.MANUFACTURING, label: "Manufacturing" },
  { value: CATEGORYTYPE.OFFICES, label: "Offices" },
  { value: CATEGORYTYPE.PERSONAL, label: "Personal" },
  { value: CATEGORYTYPE.PURCHASING, label: "Purchasing" },
  { value: CATEGORYTYPE.TECHNOLOGY, label: "Technology" },
  { value: CATEGORYTYPE.TRAVEL, label: "Travel" },
];
