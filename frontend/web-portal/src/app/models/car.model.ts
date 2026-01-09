export interface Tag {
  TagID: number;
  Name: string;
  UserID: number;
  DateAdded: string;
  DateRemoved: string | null;
  ShowsSashOnWebsite: boolean;
  SashColorHtmlHexCode: string;
  IsVisibleInWebsiteSearch: boolean;
  IsVisibleOnWebsite: boolean;
  WebsiteClickHref: string;
  HoverDescription: string;
  Priority: number | null;
}

export interface SliderImage {
  ClearImage: string;
}

export interface MonthlyPayment {
  Value: number;
  QuoteType: number;
}

export interface Feature {
  FeatureType: {
    SearchSlug: string;
    StockFeatureTypeID: number;
    FriendlyName: string;
    IconHref: string;
    SortOrder: number;
    ShowInSearchFilters: boolean;
    Description: string;
  };
  StockFeatureEntryID: number;
  StockFeatureTypeID: number;
  StockNumber: number;
  DateAdded: string;
  DateVerified: string | null;
  DateRemoved: string | null;
  BigUserIDVerified: number | null;
  BigUserIDRemoved: number | null;
}

export interface ChargeTimes {
  ChargeTimeID: number;
  StockNumber: number;
  ChargerType: string;
  ChargerDescription: string;
  ChargerSupplyType: string;
  ConnectorType: string;
  StartBatteryPercentage: number;
  EndBatteryPercentage: number;
  DurationMinutes: number;
}

export interface Car {
  Tags: Tag[];
  StockNumber: number;
  Registration: string;
  Make: string;
  Model: string;
  Spec: string;
  AskingPrice: number;
  AskingPriceWithoutCompulsoryRetailCustomerFee: number;
  Location: string;
  DisplayLocation: string;
  DestinationLocation: string;
  SiteID: number;
  DestinationSiteID: number;
  IsInStorage: boolean;
  IsInPreparation: boolean;
  Status: string;
  KeyFeaturesString: string;
  StatusEnum: number;
  DateRegistered: string;
  Engine: string;
  Mileage: number;
  EnginePower: number;
  Fuel: string;
  Transmission: string;
  Colour: string;
  TwitterImageToUse: string | null;
  WebsiteImageLinks: string[];
  LowestMonthlyPayment: number;
  FinanceQuoteType: number;
  MonthlyPaymentWithDeposit: { [key: string]: MonthlyPayment };
  OptionalExstrasTotalValue: number;
  PriceLabel: string;
  Savings: string;
  SaleText: string;
  RRP_Autotrader: number;
  AT_Position: number;
  MakeFullName: string;
  MainThumbnailImage: string;
  HasImages: boolean;
  ResultImageSrcBlurred: string;
  SliderImages: SliderImage[];
  CarDefaultImageUrl: string;
  HeadlineDescription: string;
  HeadlineDescriptionNoYear: string;
  YearString: string;
  HeadlineCaption: string;
  MOTExpiry: string;
  WebsiteURL: string;
  WebsitePrintURL: string;
  RegistrationPlateNumber: number;
  CarAge: number;
  CarAgeBand: number;
  EngineSizeString: string;
  EnginePowerBand: number;
  Doors: number;
  PreviousKeepers: number;
  Seats: number;
  BHP: number;
  MPG: number;
  MPGBand: number;
  BodyType: string;
  Co2: string;
  InsuranceGroupLetter: string;
  IsULEZ: boolean;
  PrimaryTag: Tag | null;
  Features: Feature[];
  WasPrice: number;
  WasPriceSaving: number;
  BatteryCapacityKWH: number;
  BatteryUsableCapacityKWH: number;
  BatteryRangeMiles: number;
  AutotraderTaxonomyChargeTimes: ChargeTimes[];
  InsuranceGroup: number;
  InsuranceLevel: number;
  InsuranceSecurityCode: string;
}

export interface FilterOption {
  Name: string;
  Count: number;
  Slug: string;
}

export interface FilterGroup {
  Parent: string;
  Options: FilterOption[];
}

export interface CarSearchResponse {
  Cars: Car[];
  TotalCount: number;
  CountNoImages: number;
  HasMoreCars: boolean;
  FilterOptions: FilterGroup[];
}

export interface SortOption {
  label: string;
  value: string;
  field: keyof Car;
  direction: 'asc' | 'desc';
}

export interface CarFilters {
  [key: string]: string[];
}

export interface PaginationRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: CarFilters;
}

export interface PaginationResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CarSearchRequest extends PaginationRequest {
  searchTerm?: string;
}

export interface CarSearchPaginatedResponse extends PaginationResponse<Car> {
  filterOptions: FilterGroup[];
}
