using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarSearch.Api.Data;
using CarSearch.Api.Contracts;
using CarSearch.Api.Services;
using System.Text;

namespace CarSearch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CarsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly AppDbContext _db;
    private readonly IFilterOptionsService _filterOptionsService;
    private const string SampleFileName = "search-cars-response.json";

    public CarsController(IWebHostEnvironment env, AppDbContext db, IFilterOptionsService filterOptionsService)
    {
        _env = env;
        _db = db;
        _filterOptionsService = filterOptionsService;
    }

    // Static search endpoint removed; /api/cars/search now serves dynamic full response.

    /// <summary>
    /// Paged list of cars. Use include=all to return full car DTOs instead of lite.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? make = null,
        [FromQuery] string? include = null,
        [FromQuery] string? sort = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;
        var query = _db.Cars
            .Include(c => c.Tags)
            .Include(c => c.PrimaryTag)
            .AsNoTracking()
            .AsSplitQuery();
        if (!string.IsNullOrWhiteSpace(make))
            query = query.Where(c => c.Make == make);

    var total = await query.CountAsync();

    query = ApplySort(query, sort);
        bool includeAll = string.Equals(include, "all", StringComparison.OrdinalIgnoreCase) || string.Equals(include, "true", StringComparison.OrdinalIgnoreCase);

        if (!includeAll)
        {
            var items = await query
                .OrderBy(c => c.StockNumber)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CarDto(c.StockNumber, c.Registration, c.Make, c.Model, c.Spec, c.AskingPrice))
                .ToListAsync();
            return Ok(new PagedResult<CarDto>(items, total, page, pageSize));
        }

        var carsFull = await query
            .Include(c => c.WebsiteImageLinks)
            .Include(c => c.SliderImages)
            .Include(c => c.Features).ThenInclude(f => f.FeatureType)
            .Include(c => c.AutotraderTaxonomyChargeTimes)
            .Include(c => c.MonthlyPaymentWithDeposit)
            .Include(c => c.Tags)
            .Include(c => c.PrimaryTag)
            .AsSplitQuery()
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        var fullDtos = carsFull.Select(MapFullCar).ToList();
        return Ok(new PagedResult<FullCarDto>(fullDtos, total, page, pageSize));
    }

    /// <summary>
    /// Optimized full search endpoint with efficient server-side pagination and filtering.
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<FullCarResponseDto>> SearchFull([FromQuery] SearchRequestDto request)
    {
        // Validate pagination parameters
        if (request.Page < 1) request.Page = 1;
        if (request.PageSize is < 1 or > 250) request.PageSize = 25;

        // Build base query with all necessary includes
        var baseQuery = _db.Cars
            .Include(c => c.WebsiteImageLinks)
            .Include(c => c.SliderImages)
            .Include(c => c.Features).ThenInclude(f => f.FeatureType)
            .Include(c => c.AutotraderTaxonomyChargeTimes)
            .Include(c => c.MonthlyPaymentWithDeposit)
            .Include(c => c.Tags)
            .Include(c => c.PrimaryTag)
            .AsNoTracking()
            .AsSplitQuery()
            .AsQueryable();

        // Apply filters
        var filteredQuery = ApplyFilters(baseQuery, request);

        // Get total count of filtered results (for pagination info)
        var totalMatching = await filteredQuery.CountAsync();
        
        // Generate filter options based on filtered results (efficient - no loading into memory)
        var filterOptionsTask = _filterOptionsService.GenerateFilterOptionsAsync(filteredQuery);

        // Apply sorting and pagination
        var sortedQuery = !string.IsNullOrWhiteSpace(request.SortBy) 
            ? ApplySortByDirection(filteredQuery, request.SortBy, request.SortDirection)
            : ApplySort(filteredQuery, request.Sort);
        
        // Get only the page of results we need
        var pageItems = await sortedQuery
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        // Wait for filter options to complete
        var filterOptions = await filterOptionsTask;

        // Build response
        var dto = new FullCarResponseDto
        {
            Cars = pageItems.Select(MapFullCar).ToList(),
            TotalCount = totalMatching,
            CountNoImages = pageItems.Count(c => !c.HasImages),
            HasMoreCars = (request.Page * request.PageSize) < totalMatching,
            FilterOptions = filterOptions
        };

        // Return PascalCase for this endpoint only
        var options = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = null,
            DictionaryKeyPolicy = null
        };
        return new JsonResult(dto, options);
    }

    /// <summary>
    /// Alternative search endpoint using individual query parameters (backward compatibility)
    /// </summary>
    [HttpGet("search-legacy")]
    public async Task<ActionResult<FullCarResponseDto>> SearchFullLegacy(
        [FromQuery] string? make,
        [FromQuery] string? model,
        [FromQuery] string? fuel,
        [FromQuery] string? transmission,
        [FromQuery] string? bodytype,
        [FromQuery] string? colour,
        [FromQuery] string? status,
        [FromQuery] bool? ulez,
        [FromQuery] bool? hasImages,
        [FromQuery] int? minPrice,
        [FromQuery] int? maxPrice,
        [FromQuery] int? minMileage,
        [FromQuery] int? maxMileage,
        [FromQuery] int? minBhp,
        [FromQuery] int? maxBhp,
        [FromQuery] int? seats,
        [FromQuery] int? doors,
        [FromQuery] int? year,
        [FromQuery] string? sort = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var request = new SearchRequestDto
        {
            Make = make,
            Model = model,
            Fuel = fuel,
            Transmission = transmission,
            BodyType = bodytype,
            Colour = colour,
            Status = status,
            Ulez = ulez,
            HasImages = hasImages,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            MinMileage = minMileage,
            MaxMileage = maxMileage,
            MinBhp = minBhp,
            MaxBhp = maxBhp,
            Seats = seats,
            Doors = doors,
            Year = year,
            Sort = sort,
            Page = page,
            PageSize = pageSize
        };

        return await SearchFull(request);
    }

    private IQueryable<CarSearch.Api.Domain.Car> ApplyFilters(IQueryable<CarSearch.Api.Domain.Car> query, SearchRequestDto request)
    {
        // Support CSV filters for all string facets
        if (!string.IsNullOrWhiteSpace(request.Make))
        {
            var makes = request.Make.Split(',').Select(m => m.Trim()).Where(m => !string.IsNullOrEmpty(m)).ToList();
            if (makes.Count > 0)
                query = query.Where(c => makes.Contains(c.Make));
        }

        if (!string.IsNullOrWhiteSpace(request.Model))
        {
            var models = request.Model.Split(',').Select(m => m.Trim()).Where(m => !string.IsNullOrEmpty(m)).ToList();
            if (models.Count > 0)
                query = query.Where(c => models.Contains(c.Model));
        }

        if (!string.IsNullOrWhiteSpace(request.Fuel))
        {
            var fuels = request.Fuel.Split(',').Select(f => f.Trim()).Where(f => !string.IsNullOrEmpty(f)).ToList();
            if (fuels.Count > 0)
                query = query.Where(c => fuels.Contains(c.Fuel));
        }

        if (!string.IsNullOrWhiteSpace(request.Transmission))
        {
            var transmissions = request.Transmission.Split(',').Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t)).ToList();
            if (transmissions.Count > 0)
                query = query.Where(c => transmissions.Contains(c.Transmission));
        }

        if (!string.IsNullOrWhiteSpace(request.BodyType))
        {
            var bodyTypes = request.BodyType.Split(',').Select(b => b.Trim()).Where(b => !string.IsNullOrEmpty(b)).ToList();
            if (bodyTypes.Count > 0)
                query = query.Where(c => bodyTypes.Contains(c.BodyType));
        }

        if (!string.IsNullOrWhiteSpace(request.Colour))
        {
            var colours = request.Colour.Split(',').Select(col => col.Trim()).Where(col => !string.IsNullOrEmpty(col)).ToList();
            if (colours.Count > 0)
                query = query.Where(c => colours.Contains(c.Colour));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var statuses = request.Status.Split(',').Select(s => s.Trim()).Where(s => !string.IsNullOrEmpty(s)).ToList();
            if (statuses.Count > 0)
                query = query.Where(c => statuses.Contains(c.Status));
        }

        if (!string.IsNullOrWhiteSpace(request.Location))
        {
            var locations = request.Location.Split(',').Select(l => l.Trim()).Where(l => !string.IsNullOrEmpty(l)).ToList();
            if (locations.Count > 0)
                query = query.Where(c => locations.Contains(c.Location) || locations.Contains(c.DisplayLocation));
        }
        
        if (request.Ulez.HasValue) 
            query = query.Where(c => c.IsULEZ == request.Ulez.Value);
        
        if (request.HasImages.HasValue) 
            query = query.Where(c => c.HasImages == request.HasImages.Value);
        
        if (request.MinPrice.HasValue) 
            query = query.Where(c => c.AskingPrice >= request.MinPrice.Value);
        
        if (request.MaxPrice.HasValue) 
            query = query.Where(c => c.AskingPrice <= request.MaxPrice.Value);
        
        if (request.MinMileage.HasValue) 
            query = query.Where(c => c.Mileage >= request.MinMileage.Value);
        
        if (request.MaxMileage.HasValue) 
            query = query.Where(c => c.Mileage <= request.MaxMileage.Value);
        
        if (request.MinBhp.HasValue) 
            query = query.Where(c => c.BHP >= request.MinBhp.Value);
        
        if (request.MaxBhp.HasValue) 
            query = query.Where(c => c.BHP <= request.MaxBhp.Value);
        
        if (request.Seats.HasValue) 
            query = query.Where(c => c.Seats == request.Seats.Value);
        
        if (request.Doors.HasValue) 
            query = query.Where(c => c.Doors == request.Doors.Value);
        
        if (request.Year.HasValue) 
            query = query.Where(c => c.YearString.StartsWith(request.Year.Value.ToString()));

        if (request.SiteId.HasValue) 
            query = query.Where(c => c.SiteID == request.SiteId.Value);

        return query;
    }

    private static FullCarDto MapFullCar(CarSearch.Api.Domain.Car c)
    {
        return new FullCarDto
        {
            StockNumber = c.StockNumber,
            Registration = c.Registration,
            Make = c.Make,
            Model = c.Model,
            Spec = c.Spec,
            AskingPrice = c.AskingPrice,
            AskingPriceWithoutCompulsoryRetailCustomerFee = c.AskingPriceWithoutCompulsoryRetailCustomerFee,
            Location = c.Location,
            DisplayLocation = c.DisplayLocation,
            DestinationLocation = c.DestinationLocation,
            SiteID = c.SiteID,
            DestinationSiteID = c.DestinationSiteID,
            IsInStorage = c.IsInStorage,
            IsInPreparation = c.IsInPreparation,
            Status = c.Status,
            KeyFeaturesString = c.KeyFeaturesString,
            StatusEnum = c.StatusEnum,
            DateRegistered = c.DateRegistered,
            Engine = c.Engine,
            Mileage = c.Mileage,
            EnginePower = c.EnginePower,
            Fuel = c.Fuel,
            Transmission = c.Transmission,
            Colour = c.Colour,
            TwitterImageToUse = c.TwitterImageToUse,
            WebsiteImageLinks = c.WebsiteImageLinks.Select(i => i.Url).ToList(),
            LowestMonthlyPayment = c.LowestMonthlyPayment,
            FinanceQuoteType = c.FinanceQuoteType,
            MonthlyPaymentWithDeposit = c.MonthlyPaymentWithDeposit
                .OrderBy(d => d.DepositAmount)
                .ToDictionary(d => d.DepositAmount, d => new DepositQuoteDto { Value = d.Value, QuoteType = d.QuoteType }),
            OptionalExstrasTotalValue = c.OptionalExstrasTotalValue,
            PriceLabel = c.PriceLabel,
            Savings = c.Savings,
            SaleText = c.SaleText,
            RRP_Autotrader = c.RRP_Autotrader,
            AT_Position = c.AT_Position,
            MakeFullName = c.MakeFullName,
            MainThumbnailImage = c.MainThumbnailImage,
            HasImages = c.HasImages,
            ResultImageSrcBlurred = c.ResultImageSrcBlurred,
            SliderImages = c.SliderImages.Select(s => new SliderImageDto { ClearImage = s.ClearImage }).ToList(),
            CarDefaultImageUrl = c.CarDefaultImageUrl,
            HeadlineDescription = c.HeadlineDescription,
            HeadlineDescriptionNoYear = c.HeadlineDescriptionNoYear,
            YearString = c.YearString,
            HeadlineCaption = c.HeadlineCaption,
            MOTExpiry = c.MOTExpiry,
            WebsiteURL = c.WebsiteURL,
            WebsitePrintURL = c.WebsitePrintURL,
            RegistrationPlateNumber = c.RegistrationPlateNumber,
            CarAge = c.CarAge,
            CarAgeBand = c.CarAgeBand,
            EngineSizeString = c.EngineSizeString,
            EnginePowerBand = c.EnginePowerBand,
            Doors = c.Doors,
            PreviousKeepers = c.PreviousKeepers,
            Seats = c.Seats,
            BHP = c.BHP,
            MPG = c.MPG,
            MPGBand = c.MPGBand,
            BodyType = c.BodyType,
            Co2 = c.Co2,
            InsuranceGroupLetter = c.InsuranceGroupLetter,
            IsULEZ = c.IsULEZ,
            PrimaryTag = c.PrimaryTag == null ? null : new TagDto {
                TagID = c.PrimaryTag.TagID,
                Name = c.PrimaryTag.Name,
                UserID = c.PrimaryTag.UserID,
                DateAdded = c.PrimaryTag.DateAdded,
                DateRemoved = c.PrimaryTag.DateRemoved,
                ShowsSashOnWebsite = c.PrimaryTag.ShowsSashOnWebsite,
                SashColorHtmlHexCode = c.PrimaryTag.SashColorHtmlHexCode,
                IsVisibleInWebsiteSearch = c.PrimaryTag.IsVisibleInWebsiteSearch,
                IsVisibleOnWebsite = c.PrimaryTag.IsVisibleOnWebsite,
                WebsiteClickHref = c.PrimaryTag.WebsiteClickHref,
                HoverDescription = c.PrimaryTag.HoverDescription,
                Priority = c.PrimaryTag.Priority
            },
            Tags = c.Tags.Select(t => new TagDto {
                TagID = t.TagID,
                Name = t.Name,
                UserID = t.UserID,
                DateAdded = t.DateAdded,
                DateRemoved = t.DateRemoved,
                ShowsSashOnWebsite = t.ShowsSashOnWebsite,
                SashColorHtmlHexCode = t.SashColorHtmlHexCode,
                IsVisibleInWebsiteSearch = t.IsVisibleInWebsiteSearch,
                IsVisibleOnWebsite = t.IsVisibleOnWebsite,
                WebsiteClickHref = t.WebsiteClickHref,
                HoverDescription = t.HoverDescription,
                Priority = t.Priority
            }).ToList(),
            Features = c.Features.Select(f => new FeatureDto
            {
                FeatureType = new FeatureTypeDto
                {
                    SearchSlug = f.FeatureType.SearchSlug,
                    StockFeatureTypeID = f.FeatureType.StockFeatureTypeID,
                    FriendlyName = f.FeatureType.FriendlyName,
                    IconHref = f.FeatureType.IconHref,
                    SortOrder = f.FeatureType.SortOrder,
                    ShowInSearchFilters = f.FeatureType.ShowInSearchFilters,
                    Description = f.FeatureType.Description
                },
                StockFeatureEntryID = f.StockFeatureEntryID,
                StockFeatureTypeID = f.StockFeatureTypeID,
                StockNumber = f.StockNumber,
                DateAdded = f.DateAdded,
                DateVerified = f.DateVerified,
                DateRemoved = f.DateRemoved,
                BigUserIDVerified = f.BigUserIDVerified,
                BigUserIDRemoved = f.BigUserIDRemoved
            }).ToList(),
            WasPrice = c.WasPrice,
            WasPriceSaving = c.WasPriceSaving,
            BatteryCapacityKWH = c.BatteryCapacityKWH,
            BatteryUsableCapacityKWH = c.BatteryUsableCapacityKWH,
            BatteryRangeMiles = c.BatteryRangeMiles,
            AutotraderTaxonomyChargeTimes = c.AutotraderTaxonomyChargeTimes.Select(t => new ChargeTimeDto
            {
                ChargeTimeID = t.ChargeTimeID,
                StockNumber = t.StockNumber,
                ChargerType = t.ChargerType,
                ChargerDescription = t.ChargerDescription,
                ChargerSupplyType = t.ChargerSupplyType,
                ConnectorType = t.ConnectorType,
                StartBatteryPercentage = t.StartBatteryPercentage,
                EndBatteryPercentage = t.EndBatteryPercentage,
                DurationMinutes = t.DurationMinutes
            }).ToList(),
            InsuranceGroup = c.InsuranceGroup,
            InsuranceLevel = c.InsuranceLevel,
            InsuranceSecurityCode = c.InsuranceSecurityCode
        };
    }

    private static IQueryable<CarSearch.Api.Domain.Car> ApplySort(IQueryable<CarSearch.Api.Domain.Car> query, string? sort)
    {
        if (string.IsNullOrWhiteSpace(sort))
            return query.OrderBy(c => c.StockNumber);

        return sort.ToLower() switch
        {
            "lowestprice" or "price_asc" => query.OrderBy(c => c.AskingPrice).ThenBy(c => c.StockNumber),
            "highestprice" or "price_desc" => query.OrderByDescending(c => c.AskingPrice).ThenBy(c => c.StockNumber),
            "lowestmileage" or "mileage_asc" => query.OrderBy(c => c.Mileage).ThenBy(c => c.StockNumber),
            "highestmileage" or "mileage_desc" => query.OrderByDescending(c => c.Mileage).ThenBy(c => c.StockNumber),
            "newestage" or "age_newest" => query.OrderBy(c => c.CarAge).ThenBy(c => c.StockNumber), // CarAge assumed numeric where lower = newer
            "oldestage" or "age_oldest" => query.OrderByDescending(c => c.CarAge).ThenBy(c => c.StockNumber),
            _ => query.OrderBy(c => c.StockNumber)
        };
    }

    private static IQueryable<CarSearch.Api.Domain.Car> ApplySortByDirection(IQueryable<CarSearch.Api.Domain.Car> query, string? sortBy, string? sortDirection)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
            return query.OrderBy(c => c.StockNumber);

        var isDescending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        return sortBy.ToLower() switch
        {
            "price" or "askingprice" => isDescending 
                ? query.OrderByDescending(c => (double)c.AskingPrice).ThenBy(c => c.StockNumber)
                : query.OrderBy(c => (double)c.AskingPrice).ThenBy(c => c.StockNumber),
            "mileage" => isDescending 
                ? query.OrderByDescending(c => c.Mileage).ThenBy(c => c.StockNumber)
                : query.OrderBy(c => c.Mileage).ThenBy(c => c.StockNumber),
            "age" or "carage" => isDescending 
                ? query.OrderByDescending(c => c.CarAge).ThenBy(c => c.StockNumber)
                : query.OrderBy(c => c.CarAge).ThenBy(c => c.StockNumber),
            "bhp" => isDescending 
                ? query.OrderByDescending(c => c.BHP).ThenBy(c => c.StockNumber)
                : query.OrderBy(c => c.BHP).ThenBy(c => c.StockNumber),
            "make" => isDescending 
                ? query.OrderByDescending(c => c.Make).ThenBy(c => c.StockNumber)
                : query.OrderBy(c => c.Make).ThenBy(c => c.StockNumber),
            "model" => isDescending 
                ? query.OrderByDescending(c => c.Model).ThenBy(c => c.StockNumber)
                : query.OrderBy(c => c.Model).ThenBy(c => c.StockNumber),
            "stocknumber" => isDescending 
                ? query.OrderByDescending(c => c.StockNumber)
                : query.OrderBy(c => c.StockNumber),
            _ => query.OrderBy(c => c.StockNumber)
        };
    }
    // MapFullCar retained above.
}