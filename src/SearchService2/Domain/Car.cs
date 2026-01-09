namespace CarSearch.Api.Domain;

public class Car
{
    public int StockNumber { get; set; }
    public string Registration { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Spec { get; set; } = string.Empty;
    public decimal AskingPrice { get; set; }
    public decimal AskingPriceWithoutCompulsoryRetailCustomerFee { get; set; }
    public string Location { get; set; } = string.Empty;
    public string DisplayLocation { get; set; } = string.Empty;
    public string DestinationLocation { get; set; } = string.Empty;
    public int SiteID { get; set; }
    public int DestinationSiteID { get; set; }
    public bool IsInStorage { get; set; }
    public bool IsInPreparation { get; set; }
    public string Status { get; set; } = string.Empty;
    public string KeyFeaturesString { get; set; } = string.Empty;
    public int StatusEnum { get; set; }
    public DateTime? DateRegistered { get; set; }
    public string Engine { get; set; } = string.Empty;
    public int Mileage { get; set; }
    public int EnginePower { get; set; }
    public string Fuel { get; set; } = string.Empty;
    public string Transmission { get; set; } = string.Empty;
    public string Colour { get; set; } = string.Empty;
    public string? TwitterImageToUse { get; set; }
    public int LowestMonthlyPayment { get; set; }
    public int FinanceQuoteType { get; set; }
    public int OptionalExstrasTotalValue { get; set; }
    public string PriceLabel { get; set; } = string.Empty;
    public string Savings { get; set; } = string.Empty;
    public string SaleText { get; set; } = string.Empty;
    public int RRP_Autotrader { get; set; }
    public int AT_Position { get; set; }
    public string MakeFullName { get; set; } = string.Empty;
    public string MainThumbnailImage { get; set; } = string.Empty;
    public bool HasImages { get; set; }
    public string ResultImageSrcBlurred { get; set; } = string.Empty;
    public string CarDefaultImageUrl { get; set; } = string.Empty;
    public string HeadlineDescription { get; set; } = string.Empty;
    public string HeadlineDescriptionNoYear { get; set; } = string.Empty;
    public string YearString { get; set; } = string.Empty;
    public string HeadlineCaption { get; set; } = string.Empty;
    public string MOTExpiry { get; set; } = string.Empty;
    public string WebsiteURL { get; set; } = string.Empty;
    public string WebsitePrintURL { get; set; } = string.Empty;
    public int RegistrationPlateNumber { get; set; }
    public int CarAge { get; set; }
    public int CarAgeBand { get; set; }
    public string EngineSizeString { get; set; } = string.Empty;
    public int EnginePowerBand { get; set; }
    public int Doors { get; set; }
    public int PreviousKeepers { get; set; }
    public int Seats { get; set; }
    public int BHP { get; set; }
    public int MPG { get; set; }
    public int MPGBand { get; set; }
    public string BodyType { get; set; } = string.Empty;
    public string Co2 { get; set; } = string.Empty;
    public string InsuranceGroupLetter { get; set; } = string.Empty;
    public bool IsULEZ { get; set; }
    // PrimaryTag now references a Tag entity; keep optional relation
    public int? PrimaryTagId { get; set; }
    public Tag? PrimaryTag { get; set; }
    public int WasPrice { get; set; }
    public int WasPriceSaving { get; set; }
    public decimal BatteryCapacityKWH { get; set; }
    public decimal BatteryUsableCapacityKWH { get; set; }
    public int BatteryRangeMiles { get; set; }
    public int InsuranceGroup { get; set; }
    public int InsuranceLevel { get; set; }
    public string InsuranceSecurityCode { get; set; } = string.Empty;

    public List<CarImage> WebsiteImageLinks { get; set; } = new();
    public List<SliderImage> SliderImages { get; set; } = new();
    public List<Feature> Features { get; set; } = new();
    public List<ChargeTime> AutotraderTaxonomyChargeTimes { get; set; } = new();
    public List<DepositQuote> MonthlyPaymentWithDeposit { get; set; } = new();
    public List<Tag> Tags { get; set; } = new();
}

public class Tag
{
    public int TagID { get; set; } // Source identifier
    public string Name { get; set; } = string.Empty;
    public int UserID { get; set; }
    public DateTime? DateAdded { get; set; }
    public DateTime? DateRemoved { get; set; }
    public bool ShowsSashOnWebsite { get; set; }
    public string SashColorHtmlHexCode { get; set; } = string.Empty;
    public bool IsVisibleInWebsiteSearch { get; set; }
    public bool IsVisibleOnWebsite { get; set; }
    public string WebsiteClickHref { get; set; } = string.Empty;
    public string HoverDescription { get; set; } = string.Empty;
    public int? Priority { get; set; }
    public List<Car> Cars { get; set; } = new();
}

public class CarImage
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public int CarStockNumber { get; set; }
}

public class SliderImage
{
    public int Id { get; set; }
    public string ClearImage { get; set; } = string.Empty;
    public int CarStockNumber { get; set; }
}

public class Feature
{
    public int Id { get; set; }
    public int StockFeatureEntryID { get; set; }
    public int StockFeatureTypeID { get; set; }
    public int StockNumber { get; set; }
    public DateTime? DateAdded { get; set; }
    public DateTime? DateVerified { get; set; }
    public DateTime? DateRemoved { get; set; }
    public int? BigUserIDVerified { get; set; }
    public int? BigUserIDRemoved { get; set; }
    public FeatureType FeatureType { get; set; } = new();
    public int CarStockNumber { get; set; }
}

public class FeatureType
{
    public int Id { get; set; }
    public string SearchSlug { get; set; } = string.Empty;
    public int StockFeatureTypeID { get; set; }
    public string FriendlyName { get; set; } = string.Empty;
    public string IconHref { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool ShowInSearchFilters { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class ChargeTime
{
    public int ChargeTimeID { get; set; }
    public int StockNumber { get; set; }
    public string ChargerType { get; set; } = string.Empty;
    public string ChargerDescription { get; set; } = string.Empty;
    public string ChargerSupplyType { get; set; } = string.Empty;
    public string ConnectorType { get; set; } = string.Empty;
    public int StartBatteryPercentage { get; set; }
    public int EndBatteryPercentage { get; set; }
    public int DurationMinutes { get; set; }
    public int CarStockNumber { get; set; }
}

public class DepositQuote
{
    public int Id { get; set; }
    public int DepositAmount { get; set; }
    public int Value { get; set; }
    public int QuoteType { get; set; }
    public int CarStockNumber { get; set; }
}