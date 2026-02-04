export type HistoryItem = {
  id: string;
  originalUrl: string;
  affiliateUrl: string;
  subId?: string;
  createdAt?: string;
};

export type TopProduct = {
  name?: string;
  image?: string;
  link?: string;
  aff_link?: string;
  price?: number;
  discount?: number;
  category_name?: string;
};
