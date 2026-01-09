using Microsoft.EntityFrameworkCore;
using CarSearch.Api.Data;
using CarSearch.Api.Domain;
using CarSearch.Api.Contracts;

namespace CarSearch.Api.Services;

public interface IFilterOptionsService
{
    Task<List<FilterOptionGroupDto>> GenerateFilterOptionsAsync(IQueryable<Car> baseQuery);
}

public class FilterOptionsService : IFilterOptionsService
{
    private readonly AppDbContext _context;

    public FilterOptionsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FilterOptionGroupDto>> GenerateFilterOptionsAsync(IQueryable<Car> baseQuery)
    {
        var filterList = new List<FilterOptionGroupDto>();

        // Use simple GroupBy queries without EF.Property complications
        await AddMakeOptions(filterList, baseQuery);
        await AddModelOptions(filterList, baseQuery);
        await AddSpecOptions(filterList, baseQuery);
        await AddDerivedFieldOptions(filterList, baseQuery, "derivative");
        await AddFuelOptions(filterList, baseQuery);
        await AddTransmissionOptions(filterList, baseQuery);
        await AddBodyTypeOptions(filterList, baseQuery);
        await AddLocationOptions(filterList, baseQuery);
        await AddColourOptions(filterList, baseQuery);
        await AddStatusOptions(filterList, baseQuery);
        
        // Boolean fields
        await AddUlezOptions(filterList, baseQuery);
        await AddHasImagesOptions(filterList, baseQuery);
        
        // Numeric ranges
        await AddPriceBandOptions(filterList, baseQuery);
        await AddMileageBandOptions(filterList, baseQuery);
        await AddBhpBandOptions(filterList, baseQuery);
        await AddSeatsOptions(filterList, baseQuery);
        await AddDoorsOptions(filterList, baseQuery);
        await AddMpgBandOptions(filterList, baseQuery);
        await AddAgeBandOptions(filterList, baseQuery);
        await AddYearOptions(filterList, baseQuery);
        await AddEngineSizeOptions(filterList, baseQuery);
        await AddInsuranceOptions(filterList, baseQuery);

        return filterList;
    }

    private async Task AddMakeOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var options = await baseQuery
            .Where(c => !string.IsNullOrEmpty(c.Make))
            .GroupBy(c => c.Make)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();
        filterList.Add(new FilterOptionGroupDto { Parent = "make", Options = options });
    }

    private async Task AddModelOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var options = await baseQuery
            .Where(c => !string.IsNullOrEmpty(c.Model))
            .GroupBy(c => c.Model)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();
        filterList.Add(new FilterOptionGroupDto { Parent = "model", Options = options });
    }

    private async Task AddSpecOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var options = await baseQuery
            .Where(c => !string.IsNullOrEmpty(c.Spec))
            .GroupBy(c => c.Spec)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();
        filterList.Add(new FilterOptionGroupDto { Parent = "spec", Options = options });
    }

    private async Task AddFuelOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var options = await baseQuery
            .Where(c => !string.IsNullOrEmpty(c.Fuel))
            .GroupBy(c => c.Fuel)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();
        filterList.Add(new FilterOptionGroupDto { Parent = "fuel", Options = options });
    }

    private async Task AddTransmissionOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var options = await baseQuery
            .Where(c => !string.IsNullOrEmpty(c.Transmission))
            .GroupBy(c => c.Transmission)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();
        filterList.Add(new FilterOptionGroupDto { Parent = "transmission", Options = options });
    }

    private async Task AddBodyTypeOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var options = await baseQuery
            .Where(c => !string.IsNullOrEmpty(c.BodyType))
            .GroupBy(c => c.BodyType)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();
        filterList.Add(new FilterOptionGroupDto { Parent = "bodytype", Options = options });
        
        // Also add as "body" (duplicate for compatibility)
        filterList.Add(new FilterOptionGroupDto { Parent = "body", Options = options });
    }

    private async Task AddColourOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var options = await baseQuery
            .Where(c => !string.IsNullOrEmpty(c.Colour))
            .GroupBy(c => c.Colour)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();
        filterList.Add(new FilterOptionGroupDto { Parent = "colour", Options = options });
    }

    private async Task AddStatusOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var options = await baseQuery
            .Where(c => !string.IsNullOrEmpty(c.Status))
            .GroupBy(c => c.Status)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();
        filterList.Add(new FilterOptionGroupDto { Parent = "status", Options = options });
    }

    private async Task AddUlezOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var trueCount = await baseQuery.CountAsync(c => c.IsULEZ);
        var falseCount = await baseQuery.CountAsync(c => !c.IsULEZ);

        var options = new List<FilterOptionDto>();
        if (trueCount >= 1) options.Add(new FilterOptionDto { Name = "Yes", Slug = "Yes", Count = trueCount });
        if (falseCount >= 1) options.Add(new FilterOptionDto { Name = "No", Slug = "No", Count = falseCount });

        filterList.Add(new FilterOptionGroupDto { Parent = "ulez", Options = options });
    }

    private async Task AddHasImagesOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var trueCount = await baseQuery.CountAsync(c => c.HasImages);
        var falseCount = await baseQuery.CountAsync(c => !c.HasImages);

        var options = new List<FilterOptionDto>();
        if (trueCount >= 1) options.Add(new FilterOptionDto { Name = "Yes", Slug = "Yes", Count = trueCount });
        if (falseCount >= 1) options.Add(new FilterOptionDto { Name = "No", Slug = "No", Count = falseCount });

        filterList.Add(new FilterOptionGroupDto { Parent = "hasimages", Options = options });
    }

    private async Task AddSeatsOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var groups = await baseQuery
            .Where(c => c.Seats > 0)
            .GroupBy(c => c.Seats)
            .Select(g => new { Seats = g.Key, Count = g.Count() })
            .Where(g => g.Count >= 1)
            .OrderBy(g => g.Seats)
            .ToListAsync();
        
        var options = groups
            .Select(g => new FilterOptionDto { Name = g.Seats.ToString(), Slug = g.Seats.ToString(), Count = g.Count })
            .ToList();
            
        filterList.Add(new FilterOptionGroupDto { Parent = "seats", Options = options });
    }

    private async Task AddDoorsOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var groups = await baseQuery
            .Where(c => c.Doors > 0)
            .GroupBy(c => c.Doors)
            .Select(g => new { Doors = g.Key, Count = g.Count() })
            .Where(g => g.Count >= 1)
            .OrderBy(g => g.Doors)
            .ToListAsync();
        
        var options = groups
            .Select(g => new FilterOptionDto { Name = g.Doors.ToString(), Slug = g.Doors.ToString(), Count = g.Count })
            .ToList();
            
        filterList.Add(new FilterOptionGroupDto { Parent = "doors", Options = options });
    }

    private async Task AddDerivedFieldOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery, string parent)
    {
        // Get the data and create derivatives on client side
        var carData = await baseQuery
            .Select(c => new { 
                MakeFullName = c.MakeFullName,
                Model = c.Model,
                Spec = c.Spec
            })
            .ToListAsync();

        var options = carData
            .Select(c => string.IsNullOrWhiteSpace(c.MakeFullName) ? (c.Model + " " + c.Spec).Trim() : c.MakeFullName)
            .Where(derivative => !string.IsNullOrWhiteSpace(derivative))
            .GroupBy(derivative => derivative)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = parent, Options = options });
    }

    private async Task AddLocationOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        // Get location data and process on client side
        var locationData = await baseQuery
            .Select(c => new { 
                Location = c.Location,
                DisplayLocation = c.DisplayLocation
            })
            .ToListAsync();

        var options = locationData
            .Select(c => string.IsNullOrWhiteSpace(c.DisplayLocation) ? c.Location : c.DisplayLocation)
            .Where(location => !string.IsNullOrWhiteSpace(location))
            .GroupBy(location => location)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = "location", Options = options });
    }


    private async Task AddPriceBandOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        // Get raw price data and create bands on client side to avoid EF translation issues
        var prices = await baseQuery
            .Select(c => c.AskingPrice)
            .ToListAsync();

        var priceGroups = prices
            .GroupBy(p =>
            {
                if (p < 5000) return "<5k";
                if (p < 10000) return "5k-9.9k";
                if (p < 20000) return "10k-19.9k";
                if (p < 30000) return "20k-29.9k";
                if (p < 40000) return "30k-39.9k";
                if (p < 50000) return "40k-49.9k";
                if (p < 75000) return "50k-74.9k";
                if (p < 100000) return "75k-99.9k";
                return ">=100k";
            })
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name switch
            {
                "<5k" => 1,
                "5k-9.9k" => 2,
                "10k-19.9k" => 3,
                "20k-29.9k" => 4,
                "30k-39.9k" => 5,
                "40k-49.9k" => 6,
                "50k-74.9k" => 7,
                "75k-99.9k" => 8,
                ">=100k" => 9,
                _ => 10
            })
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = "price", Options = priceGroups });
    }

    private async Task AddMileageBandOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        // First get the raw band values, then format on client side
        var mileageBands = await baseQuery
            .Select(c => (c.Mileage / 10000) * 10000)
            .GroupBy(band => band)
            .Select(g => new { Band = g.Key, Count = g.Count() })
            .ToListAsync();

        var options = mileageBands
            .Where(x => x.Count >= 1)
            .Select(x => new FilterOptionDto
            {
                Name = x.Band >= 100000 ? ">=100000" : $"{x.Band}-{x.Band + 9999}",
                Slug = x.Band >= 100000 ? ">=100000" : $"{x.Band}-{x.Band + 9999}",
                Count = x.Count
            })
            .OrderBy(o => o.Name)
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = "mileage", Options = options });
    }

    private async Task AddBhpBandOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        // First get the raw band values, then format on client side
        var bhpBands = await baseQuery
            .Where(c => c.BHP > 0)
            .Select(c => (c.BHP / 50) * 50)
            .GroupBy(band => band)
            .Select(g => new { Band = g.Key, Count = g.Count() })
            .ToListAsync();

        var options = bhpBands
            .Where(x => x.Count >= 1)
            .Select(x => new FilterOptionDto
            {
                Name = x.Band >= 500 ? ">=500" : $"{x.Band}-{x.Band + 49}",
                Slug = x.Band >= 500 ? ">=500" : $"{x.Band}-{x.Band + 49}",
                Count = x.Count
            })
            .OrderBy(o => o.Name)
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = "bhp", Options = options });
    }

    private async Task AddMpgBandOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        // Get MPG values and create bands on client side
        var mpgValues = await baseQuery
            .Where(c => (c.MPGBand != 0 ? c.MPGBand : c.MPG) > 0)
            .Select(c => c.MPGBand != 0 ? c.MPGBand : c.MPG)
            .ToListAsync();

        var mpgGroups = mpgValues
            .Select(mpg => (mpg / 10) * 10)
            .GroupBy(band => band)
            .Select(g => new FilterOptionDto
            {
                Name = g.Key >= 200 ? ">=200" : $"{g.Key}-{g.Key + 9}",
                Slug = g.Key >= 200 ? ">=200" : $"{g.Key}-{g.Key + 9}",
                Count = g.Count()
            })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = "mpg", Options = mpgGroups });
    }

    private async Task AddAgeBandOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        // Get age values and create bands on client side
        var ageValues = await baseQuery
            .Where(c => (c.CarAgeBand != 0 ? c.CarAgeBand : c.CarAge) >= 0)
            .Select(c => c.CarAgeBand != 0 ? c.CarAgeBand : c.CarAge)
            .ToListAsync();

        var ageGroups = ageValues
            .GroupBy(age => age)
            .Select(g => new FilterOptionDto
            {
                Name = g.Key >= 30 ? ">=30" : g.Key.ToString(),
                Slug = g.Key >= 30 ? ">=30" : g.Key.ToString(),
                Count = g.Count()
            })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = "age", Options = ageGroups });
    }

    private async Task AddYearOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        // Get year strings and extract years on client side
        var yearStrings = await baseQuery
            .Where(c => !string.IsNullOrWhiteSpace(c.YearString) && c.YearString.Length >= 4)
            .Select(c => c.YearString)
            .ToListAsync();

        var yearOptions = yearStrings
            .Where(y => char.IsDigit(y[0]))
            .Select(y => y.Split(' ')[0])
            .GroupBy(y => y)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderByDescending(o => o.Name)
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = "year", Options = yearOptions });
    }

    private async Task AddEngineSizeOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        var engineOptions = await baseQuery
            .Where(c => !string.IsNullOrWhiteSpace(c.EngineSizeString) && c.EngineSizeString != "-")
            .GroupBy(c => c.EngineSizeString)
            .Select(g => new FilterOptionDto 
            { 
                Name = g.Key, 
                Slug = g.Key, 
                Count = g.Count() 
            })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToListAsync();

        filterList.Add(new FilterOptionGroupDto { Parent = "engine-size", Options = engineOptions });
    }

    private async Task AddInsuranceOptions(List<FilterOptionGroupDto> filterList, IQueryable<Car> baseQuery)
    {
        // Get insurance data and format on client side
        var insuranceData = await baseQuery
            .Where(c => c.InsuranceGroup > 0)
            .Select(c => new { Group = c.InsuranceGroup, Level = c.InsuranceLevel })
            .ToListAsync();

        var insuranceOptions = insuranceData
            .Select(x => new { Label = $"Group {x.Group} - Level {x.Level}" })
            .GroupBy(x => x.Label)
            .Select(g => new FilterOptionDto { Name = g.Key, Slug = g.Key, Count = g.Count() })
            .Where(o => o.Count >= 1)
            .OrderBy(o => o.Name)
            .ToList();

        filterList.Add(new FilterOptionGroupDto { Parent = "insurance", Options = insuranceOptions });
    }
}