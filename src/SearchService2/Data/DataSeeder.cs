using System.Text.Json;
using CarSearch.Api.Domain;

namespace CarSearch.Api.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db, IWebHostEnvironment env, ILogger logger, CancellationToken cancellationToken = default)
    {
        if (db.Cars.Any())
        {
            logger.LogInformation("Seeding skipped: Cars table already contains data.");
            return; // Already seeded
        }

        // Prefer new seed file name; fallback to legacy
        var primaryFile = Path.Combine(env.ContentRootPath, "SampleData", "cars-seed-data.json");
        var legacyFile = Path.Combine(env.ContentRootPath, "SampleData", "search-cars-response.json");
        string? file = null;
        if (File.Exists(primaryFile)) file = primaryFile; else if (File.Exists(legacyFile)) file = legacyFile; else
        {
            logger.LogWarning("No seed file found at {Primary} or {Legacy}; seeding aborted.", primaryFile, legacyFile);
            return;
        }

        logger.LogInformation("Using seed file: {SeedFile}", file);

        using var stream = File.OpenRead(file);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

        // Support either { "Cars": [ ... ] } root or a raw array
        JsonElement carsElement;
        if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("Cars", out var ce) && ce.ValueKind == JsonValueKind.Array)
        {
            carsElement = ce;
        }
        else if (doc.RootElement.ValueKind == JsonValueKind.Array)
        {
            carsElement = doc.RootElement;
        }
        else
        {
            logger.LogWarning("Seed JSON root structure not recognized; expected array or object with 'Cars' property.");
            return;
        }
        var expected = carsElement.GetArrayLength();
        int inserted = 0;
        int failed = 0;
        var failures = new List<string>();

        var featureTypeCache = new Dictionary<int, FeatureType>();
        var tagCache = new Dictionary<int, Tag>();
        int index = 0;
        foreach (var carEl in carsElement.EnumerateArray())
        {
            index++;
            Car? car = null;
            int stockNumber = 0;
            try
            {
                stockNumber = GetInt(carEl, "StockNumber");
                car = new Car
                {
                StockNumber = GetInt(carEl, "StockNumber"),
                Registration = GetString(carEl, "Registration"),
                Make = GetString(carEl, "Make"),
                Model = GetString(carEl, "Model"),
                Spec = GetString(carEl, "Spec"),
                AskingPrice = GetDecimal(carEl, "AskingPrice"),
                AskingPriceWithoutCompulsoryRetailCustomerFee = GetDecimal(carEl, "AskingPriceWithoutCompulsoryRetailCustomerFee"),
                Location = GetString(carEl, "Location"),
                DisplayLocation = GetString(carEl, "DisplayLocation"),
                DestinationLocation = GetString(carEl, "DestinationLocation"),
                SiteID = GetInt(carEl, "SiteID"),
                DestinationSiteID = GetInt(carEl, "DestinationSiteID"),
                IsInStorage = GetBool(carEl, "IsInStorage"),
                IsInPreparation = GetBool(carEl, "IsInPreparation"),
                Status = GetString(carEl, "Status"),
                KeyFeaturesString = GetString(carEl, "KeyFeaturesString"),
                StatusEnum = GetInt(carEl, "StatusEnum"),
                DateRegistered = GetDateTime(carEl, "DateRegistered"),
                Engine = GetString(carEl, "Engine"),
                Mileage = GetInt(carEl, "Mileage"),
                // EnginePower sometimes comes as decimal (0.0) in new seed – clamp to int
                EnginePower = GetIntFlexible(carEl, "EnginePower"),
                Fuel = GetString(carEl, "Fuel"),
                Transmission = GetString(carEl, "Transmission"),
                Colour = GetString(carEl, "Colour"),
                TwitterImageToUse = GetNullableString(carEl, "TwitterImageToUse"),
                LowestMonthlyPayment = GetIntFlexible(carEl, "LowestMonthlyPayment"),
                FinanceQuoteType = GetInt(carEl, "FinanceQuoteType"),
                OptionalExstrasTotalValue = GetInt(carEl, "OptionalExstrasTotalValue"),
                PriceLabel = GetString(carEl, "PriceLabel"),
                Savings = GetString(carEl, "Savings"),
                SaleText = GetString(carEl, "SaleText"),
                RRP_Autotrader = GetIntFlexible(carEl, "RRP_Autotrader"),
                AT_Position = GetInt(carEl, "AT_Position"),
                MakeFullName = GetString(carEl, "MakeFullName"),
                MainThumbnailImage = GetString(carEl, "MainThumbnailImage"),
                HasImages = GetBool(carEl, "HasImages"),
                ResultImageSrcBlurred = GetString(carEl, "ResultImageSrcBlurred"),
                CarDefaultImageUrl = GetString(carEl, "CarDefaultImageUrl"),
                HeadlineDescription = GetString(carEl, "HeadlineDescription"),
                HeadlineDescriptionNoYear = GetString(carEl, "HeadlineDescriptionNoYear"),
                YearString = GetString(carEl, "YearString"),
                HeadlineCaption = GetString(carEl, "HeadlineCaption"),
                MOTExpiry = GetString(carEl, "MOTExpiry"),
                WebsiteURL = GetString(carEl, "WebsiteURL"),
                WebsitePrintURL = GetString(carEl, "WebsitePrintURL"),
                RegistrationPlateNumber = GetIntFlexible(carEl, "RegistrationPlateNumber"),
                CarAge = GetInt(carEl, "CarAge"),
                CarAgeBand = GetInt(carEl, "CarAgeBand"),
                EngineSizeString = GetString(carEl, "EngineSizeString"),
                EnginePowerBand = GetIntFlexible(carEl, "EnginePowerBand"),
                Doors = GetInt(carEl, "Doors"),
                PreviousKeepers = GetInt(carEl, "PreviousKeepers"),
                Seats = GetInt(carEl, "Seats"),
                BHP = GetInt(carEl, "BHP"),
                MPG = GetInt(carEl, "MPG"),
                MPGBand = GetInt(carEl, "MPGBand"),
                BodyType = GetString(carEl, "BodyType"),
                Co2 = GetString(carEl, "Co2"),
                InsuranceGroupLetter = GetString(carEl, "InsuranceGroupLetter"),
                IsULEZ = GetBool(carEl, "IsULEZ"),
                WasPrice = GetIntFlexible(carEl, "WasPrice"),
                WasPriceSaving = GetIntFlexible(carEl, "WasPriceSaving"),
                BatteryCapacityKWH = GetDecimal(carEl, "BatteryCapacityKWH"),
                BatteryUsableCapacityKWH = GetDecimal(carEl, "BatteryUsableCapacityKWH"),
                BatteryRangeMiles = GetIntFlexible(carEl, "BatteryRangeMiles"),
                InsuranceGroup = GetIntFlexible(carEl, "InsuranceGroup"),
                InsuranceLevel = GetIntFlexible(carEl, "InsuranceLevel"),
                InsuranceSecurityCode = GetString(carEl, "InsuranceSecurityCode")
                };

            // Tags array (reusing cached Tag instances)
            if (carEl.TryGetProperty("Tags", out var tagsEl) && tagsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var tagEl in tagsEl.EnumerateArray())
                {
                    if (tagEl.ValueKind != JsonValueKind.Object) continue;
                    var parsed = ParseOrGetCachedTag(tagEl, tagCache);
                    if (!car.Tags.Any(t => t.TagID == parsed.TagID)) car.Tags.Add(parsed);
                }
            }

            // PrimaryTag object (reuse same cached Tag)
            if (carEl.TryGetProperty("PrimaryTag", out var primaryTagEl) && primaryTagEl.ValueKind == JsonValueKind.Object)
            {
                var pt = ParseOrGetCachedTag(primaryTagEl, tagCache);
                if (!car.Tags.Any(t => t.TagID == pt.TagID))
                    car.Tags.Add(pt);
                car.PrimaryTagId = pt.TagID;
                car.PrimaryTag = pt;
            }

            // WebsiteImageLinks (array of strings)
            if (carEl.TryGetProperty("WebsiteImageLinks", out var imgs) && imgs.ValueKind == JsonValueKind.Array)
            {
                foreach (var i in imgs.EnumerateArray())
                {
                    car.WebsiteImageLinks.Add(new CarImage { Url = i.GetString() ?? string.Empty, CarStockNumber = car.StockNumber });
                }
            }

            // SliderImages (array of objects with ClearImage)
            if (carEl.TryGetProperty("SliderImages", out var sliders) && sliders.ValueKind == JsonValueKind.Array)
            {
                foreach (var s in sliders.EnumerateArray())
                {
                    var clear = s.TryGetProperty("ClearImage", out var ci) ? ci.GetString() ?? string.Empty : string.Empty;
                    car.SliderImages.Add(new SliderImage { ClearImage = clear, CarStockNumber = car.StockNumber });
                }
            }

            // Features (with feature type caching to avoid duplicates)
            if (carEl.TryGetProperty("Features", out var features) && features.ValueKind == JsonValueKind.Array)
            {
                foreach (var f in features.EnumerateArray())
                {
                    var feature = new Feature
                    {
                        StockFeatureEntryID = GetInt(f, "StockFeatureEntryID"),
                        StockFeatureTypeID = GetInt(f, "StockFeatureTypeID"),
                        StockNumber = GetInt(f, "StockNumber"),
                        DateAdded = GetDateTime(f, "DateAdded"),
                        DateVerified = GetDateTime(f, "DateVerified"),
                        DateRemoved = GetDateTime(f, "DateRemoved"),
                        BigUserIDVerified = GetNullableInt(f, "BigUserIDVerified"), // sometimes null in seed
                        BigUserIDRemoved = GetNullableInt(f, "BigUserIDRemoved"),
                        CarStockNumber = car.StockNumber,
                    };
                    if (f.TryGetProperty("FeatureType", out var ft) && ft.ValueKind == JsonValueKind.Object)
                    {
                        var ftId = GetInt(ft, "StockFeatureTypeID");
                        if (!featureTypeCache.TryGetValue(ftId, out var ftEntity))
                        {
                            ftEntity = new FeatureType
                            {
                                SearchSlug = GetString(ft, "SearchSlug"),
                                StockFeatureTypeID = ftId,
                                FriendlyName = GetString(ft, "FriendlyName"),
                                IconHref = GetString(ft, "IconHref"),
                                SortOrder = GetInt(ft, "SortOrder"),
                                ShowInSearchFilters = GetBool(ft, "ShowInSearchFilters"),
                                Description = GetString(ft, "Description")
                            };
                            featureTypeCache[ftId] = ftEntity;
                        }
                        feature.FeatureType = ftEntity;
                    }
                    car.Features.Add(feature);
                }
            }

            // Charge times
            if (carEl.TryGetProperty("AutotraderTaxonomyChargeTimes", out var charges) && charges.ValueKind == JsonValueKind.Array)
            {
                foreach (var ctime in charges.EnumerateArray())
                {
                    car.AutotraderTaxonomyChargeTimes.Add(new ChargeTime
                    {
                        ChargeTimeID = GetInt(ctime, "ChargeTimeID"),
                        StockNumber = GetInt(ctime, "StockNumber"),
                        ChargerType = GetString(ctime, "ChargerType"),
                        ChargerDescription = GetString(ctime, "ChargerDescription"),
                        ChargerSupplyType = GetString(ctime, "ChargerSupplyType"),
                        ConnectorType = GetString(ctime, "ConnectorType"),
                        StartBatteryPercentage = GetInt(ctime, "StartBatteryPercentage"),
                        EndBatteryPercentage = GetInt(ctime, "EndBatteryPercentage"),
                        DurationMinutes = GetInt(ctime, "DurationMinutes"),
                        CarStockNumber = car.StockNumber
                    });
                }
            }

            // Deposit quotes (MonthlyPaymentWithDeposit) -> dictionary of deposit -> { Value, QuoteType }
            if (carEl.TryGetProperty("MonthlyPaymentWithDeposit", out var mpwd) && mpwd.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in mpwd.EnumerateObject())
                {
                    if (prop.Value.ValueKind == JsonValueKind.Object)
                    {
                        var val = prop.Value;
                        car.MonthlyPaymentWithDeposit.Add(new DepositQuote
                        {
                            DepositAmount = int.TryParse(prop.Name, out var d) ? d : 0,
                            Value = GetIntFlexible(val, "Value"),
                            QuoteType = GetInt(val, "QuoteType"),
                            CarStockNumber = car.StockNumber
                        });
                    }
                }
            }

                db.Cars.Add(car);
                inserted++;
            }
            catch (Exception ex)
            {
                failed++;
                var ident = stockNumber != 0 ? stockNumber.ToString() : $"index:{index}";
                var msg = $"Car seed failed (StockNumber={ident}): {ex.Message}";
                failures.Add(msg);
                logger.LogError(ex, "{Message}", msg);
            }
        }
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SaveChanges failed after seeding. Inserted={Inserted} Failed={Failed} Expected={Expected}", inserted, failed, expected);
            throw;
        }

        if (failed == 0)
        {
            logger.LogInformation("Seeding completed successfully. Inserted {Inserted} cars (Expected {Expected}).", inserted, expected);
        }
        else
        {
            logger.LogWarning("Seeding completed with failures. Inserted {Inserted} / {Expected}. Failed {Failed}. See prior error logs.", inserted, expected, failed);
            // Optionally output condensed failure list
            foreach (var f in failures.Take(10))
            {
                logger.LogWarning("Failure: {Failure}", f);
            }
            if (failures.Count > 10)
            {
                logger.LogWarning("Additional {Extra} failures suppressed.", failures.Count - 10);
            }
        }
    }

    private static string GetString(JsonElement el, string name) => el.TryGetProperty(name, out var p) && p.ValueKind != JsonValueKind.Null ? p.GetString() ?? string.Empty : string.Empty;
    private static string? GetNullableString(JsonElement el, string name) => el.TryGetProperty(name, out var p) && p.ValueKind != JsonValueKind.Null ? p.GetString() : null;
    private static int GetInt(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var p)) return 0;
        if (p.ValueKind == JsonValueKind.Null) return 0;
        if (p.ValueKind == JsonValueKind.Number && p.TryGetInt32(out var v)) return v;
        if (p.ValueKind == JsonValueKind.String && int.TryParse(p.GetString(), out var vs)) return vs;
        return 0;
    }
    private static int? GetNullableInt(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var p)) return null;
        if (p.ValueKind != JsonValueKind.Number) return null;
        return p.TryGetInt32(out var v) ? v : null;
    }
    private static bool GetBool(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var p)) return false;
        return p.ValueKind == JsonValueKind.True;
    }
    private static DateTime? GetDateTime(JsonElement el, string name) => el.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String && DateTime.TryParse(p.GetString(), out var dt) ? dt : null;
    private static decimal GetDecimal(JsonElement el, string name)
    {
        if (el.TryGetProperty(name, out var p))
        {
            if (p.ValueKind == JsonValueKind.Number && p.TryGetDecimal(out var d)) return d;
            if (p.ValueKind == JsonValueKind.String && decimal.TryParse(p.GetString(), out var ds)) return ds;
        }
        return 0m;
    }

    private static int GetIntFlexible(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var p)) return 0;
        if (p.ValueKind == JsonValueKind.Null) return 0;
        if (p.ValueKind == JsonValueKind.Number)
        {
            if (p.TryGetInt32(out var i)) return i;
            if (p.TryGetDecimal(out var dec)) return (int)decimal.Truncate(dec);
            if (p.TryGetDouble(out var dbl)) return (int)Math.Truncate(dbl);
        }
        if (p.ValueKind == JsonValueKind.String)
        {
            var s = p.GetString();
            if (int.TryParse(s, out var ii)) return ii;
            if (decimal.TryParse(s, out var dd)) return (int)decimal.Truncate(dd);
            if (double.TryParse(s, out var d2)) return (int)Math.Truncate(d2);
        }
        return 0;
    }

    private static Tag ParseOrGetCachedTag(JsonElement tag, Dictionary<int, Tag> cache)
    {
        var id = GetInt(tag, "TagID");
        if (id != 0 && cache.TryGetValue(id, out var existing))
        {
            // Update car association if needed (keep first association; tags are promotional not exclusive)
            return existing;
        }
        var created = new Tag
        {
            TagID = id,
            Name = GetString(tag, "Name"),
            UserID = GetInt(tag, "UserID"),
            DateAdded = GetDateTime(tag, "DateAdded"),
            DateRemoved = GetDateTime(tag, "DateRemoved"),
            ShowsSashOnWebsite = GetBool(tag, "ShowsSashOnWebsite"),
            SashColorHtmlHexCode = GetString(tag, "SashColorHtmlHexCode"),
            IsVisibleInWebsiteSearch = GetBool(tag, "IsVisibleInWebsiteSearch"),
            IsVisibleOnWebsite = GetBool(tag, "IsVisibleOnWebsite"),
            WebsiteClickHref = GetString(tag, "WebsiteClickHref"),
            HoverDescription = GetString(tag, "HoverDescription"),
            Priority = GetNullableInt(tag, "Priority")
        };
        if (id != 0) cache[id] = created;
        return created;
    }
}