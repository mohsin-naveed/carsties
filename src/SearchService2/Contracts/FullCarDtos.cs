namespace CarSearch.Api.Contracts;

// Property order matches required JSON exactly.
public sealed class FullCarResponseDto
{
    public List<FullCarDto> Cars { get; set; } = new();
    public int TotalCount { get; set; }
    public int CountNoImages { get; set; }
    public bool HasMoreCars { get; set; }
    public List<FilterOptionGroupDto> FilterOptions { get; set; } = new();
}

public sealed class FullCarDto
{
    public List<TagDto> Tags { get; set; } = new();
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
    public List<string> WebsiteImageLinks { get; set; } = new();
    public int LowestMonthlyPayment { get; set; }
    public int FinanceQuoteType { get; set; }
    public Dictionary<int, DepositQuoteDto> MonthlyPaymentWithDeposit { get; set; } = new();
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
    public List<SliderImageDto> SliderImages { get; set; } = new();
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
    public TagDto? PrimaryTag { get; set; }
    public List<FeatureDto> Features { get; set; } = new();
    public int WasPrice { get; set; }
    public int WasPriceSaving { get; set; }
    public decimal BatteryCapacityKWH { get; set; }
    public decimal BatteryUsableCapacityKWH { get; set; }
    public int BatteryRangeMiles { get; set; }
    public List<ChargeTimeDto> AutotraderTaxonomyChargeTimes { get; set; } = new();
    public int InsuranceGroup { get; set; }
    public int InsuranceLevel { get; set; }
    public string InsuranceSecurityCode { get; set; } = string.Empty;
}

public sealed class SliderImageDto { public string ClearImage { get; set; } = string.Empty; }
public sealed class DepositQuoteDto { public int Value { get; set; } public int QuoteType { get; set; } }
public sealed class FeatureDto
{
    public FeatureTypeDto FeatureType { get; set; } = new();
    public int StockFeatureEntryID { get; set; }
    public int StockFeatureTypeID { get; set; }
    public int StockNumber { get; set; }
    public DateTime? DateAdded { get; set; }
    public DateTime? DateVerified { get; set; }
    public DateTime? DateRemoved { get; set; }
    public int? BigUserIDVerified { get; set; }
    public int? BigUserIDRemoved { get; set; }
}
public sealed class FeatureTypeDto
{
    public string SearchSlug { get; set; } = string.Empty;
    public int StockFeatureTypeID { get; set; }
    public string FriendlyName { get; set; } = string.Empty;
    public string IconHref { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool ShowInSearchFilters { get; set; }
    public string Description { get; set; } = string.Empty;
}
public sealed class ChargeTimeDto
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
}

public sealed class FilterOptionGroupDto
{
    public string Parent { get; set; } = string.Empty;
    public List<FilterOptionDto> Options { get; set; } = new();
}
public sealed class FilterOptionDto
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Slug { get; set; } = string.Empty;
}

public sealed class TagDto
{
    public int TagID { get; set; }
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
}