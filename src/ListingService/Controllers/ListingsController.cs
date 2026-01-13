using AutoMapper;
using ListingService.Data;
using ListingService.DTOs;
using ListingService.Entities;
using ListingService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace ListingService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController(ListingDbContext context, IMapper mapper, ICatalogLookup catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ListingDto>>> GetAll(
        [FromQuery] int? makeId,
        [FromQuery(Name = "makeIds")] int[]? makeIds,
        [FromQuery] int? modelId,
        [FromQuery(Name = "modelIds")] int[]? modelIds,
        [FromQuery] int? variantId,
        [FromQuery(Name = "variantIds")] int[]? variantIds,
        [FromQuery] int? transmissionId,
        [FromQuery(Name = "transmissionIds")] int[]? transmissionIds,
        [FromQuery] int? bodyTypeId,
        [FromQuery(Name = "bodyTypeIds")] int[]? bodyTypeIds,
        [FromQuery] int? fuelTypeId,
        [FromQuery(Name = "fuelTypeIds")] int[]? fuelTypeIds,
        [FromQuery] decimal? priceMin,
        [FromQuery] decimal? priceMax,
        [FromQuery] int? yearMin,
        [FromQuery] int? yearMax,
        [FromQuery] int? mileageMin,
        [FromQuery] int? mileageMax)
    {
        var query = context.Listings.Include(l => l.Images).AsQueryable();
        if (priceMin is not null) query = query.Where(l => l.Price >= priceMin);
        if (priceMax is not null) query = query.Where(l => l.Price <= priceMax);
        if (yearMin is not null) query = query.Where(l => l.Year >= yearMin);
        if (yearMax is not null) query = query.Where(l => l.Year <= yearMax);
        if (mileageMin is not null) query = query.Where(l => l.Mileage >= mileageMin);
        if (mileageMax is not null) query = query.Where(l => l.Mileage <= mileageMax);
        if (makeId is not null) query = query.Where(l => l.MakeId == makeId);
        else if (makeIds is not null && makeIds.Length > 0) query = query.Where(l => makeIds.Contains(l.MakeId));

        if (modelId is not null) query = query.Where(l => l.ModelId == modelId);
        else if (modelIds is not null && modelIds.Length > 0) query = query.Where(l => modelIds.Contains(l.ModelId));

        if (variantId is not null) query = query.Where(l => l.VariantId == variantId);
        else if (variantIds is not null && variantIds.Length > 0) query = query.Where(l => variantIds.Contains(l.VariantId));

        if (transmissionId is not null) query = query.Where(l => l.TransmissionId == transmissionId);
        else if (transmissionIds is not null && transmissionIds.Length > 0) query = query.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));

        if (bodyTypeId is not null) query = query.Where(l => l.BodyTypeId == bodyTypeId);
        else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) query = query.Where(l => bodyTypeIds.Contains(l.BodyTypeId));

        if (fuelTypeId is not null) query = query.Where(l => l.FuelTypeId == fuelTypeId);
        else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) query = query.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));
        var items = await query.ToListAsync();
        var dtos = items.Select(mapper.Map<ListingDto>).ToList();
        var featuresByListing = await context.ListingFeatures
            .GroupBy(f => f.ListingId)
            .Select(g => new { ListingId = g.Key, FeatureIds = g.Select(x => x.FeatureId).ToArray() })
            .ToListAsync();
        var dict = featuresByListing.ToDictionary(x => x.ListingId, x => x.FeatureIds);
        foreach (var d in dtos)
        {
            dict.TryGetValue(d.Id, out var ids);
            d.FeatureIds = ids;
        }
        return dtos;
    }

    [HttpGet("facets")]
    public async Task<ActionResult<FacetCountsDto>> GetFacetCounts(
        [FromQuery] int? makeId,
        [FromQuery(Name = "makeIds")] int[]? makeIds,
        [FromQuery] int? modelId,
        [FromQuery(Name = "modelIds")] int[]? modelIds,
        [FromQuery] int? variantId,
        [FromQuery(Name = "variantIds")] int[]? variantIds,
        [FromQuery] int? transmissionId,
        [FromQuery(Name = "transmissionIds")] int[]? transmissionIds,
        [FromQuery] int? bodyTypeId,
        [FromQuery(Name = "bodyTypeIds")] int[]? bodyTypeIds,
        [FromQuery] int? fuelTypeId,
        [FromQuery(Name = "fuelTypeIds")] int[]? fuelTypeIds,
        [FromQuery] decimal? priceMin,
        [FromQuery] decimal? priceMax,
        [FromQuery] int? yearMin,
        [FromQuery] int? yearMax,
        [FromQuery] int? mileageMin,
        [FromQuery] int? mileageMax,
        [FromQuery(Name = "seats")] int[]? seats,
        [FromQuery(Name = "doors")] int[]? doors)
    {
        // Base query for counts
        IQueryable<Listing> Base() {
            var q = context.Listings.AsNoTracking();
            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
            return q;
        }
        IQueryable<Listing> BaseWithoutYear() {
            var q = context.Listings.AsNoTracking();
            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
            return q;
        }
        IQueryable<Listing> BaseWithoutPrice() {
            var q = context.Listings.AsNoTracking();
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
            return q;
        }
        IQueryable<Listing> BaseWithoutMileage() {
            var q = context.Listings.AsNoTracking();
            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
            return q;
        }

        // Apply filters except the facet under evaluation
        IQueryable<Listing> ApplyWithoutMake(IQueryable<Listing> q) {
            if (modelId is not null) q = q.Where(l => l.ModelId == modelId);
            else if (modelIds is not null && modelIds.Length > 0) q = q.Where(l => modelIds.Contains(l.ModelId));
            if (variantId is not null) q = q.Where(l => l.VariantId == variantId);
            else if (variantIds is not null && variantIds.Length > 0) q = q.Where(l => variantIds.Contains(l.VariantId));
            if (transmissionId is not null) q = q.Where(l => l.TransmissionId == transmissionId);
            else if (transmissionIds is not null && transmissionIds.Length > 0) q = q.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));
            if (bodyTypeId is not null) q = q.Where(l => l.BodyTypeId == bodyTypeId);
            else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) q = q.Where(l => bodyTypeIds.Contains(l.BodyTypeId));
            if (fuelTypeId is not null) q = q.Where(l => l.FuelTypeId == fuelTypeId);
            else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) q = q.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
            return q;
        }
        IQueryable<Listing> ApplyWithoutModel(IQueryable<Listing> q) {
            if (makeId is not null) q = q.Where(l => l.MakeId == makeId);
            else if (makeIds is not null && makeIds.Length > 0) q = q.Where(l => makeIds.Contains(l.MakeId));
            if (variantId is not null) q = q.Where(l => l.VariantId == variantId);
            else if (variantIds is not null && variantIds.Length > 0) q = q.Where(l => variantIds.Contains(l.VariantId));
            if (transmissionId is not null) q = q.Where(l => l.TransmissionId == transmissionId);
            else if (transmissionIds is not null && transmissionIds.Length > 0) q = q.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));
            if (bodyTypeId is not null) q = q.Where(l => l.BodyTypeId == bodyTypeId);
            else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) q = q.Where(l => bodyTypeIds.Contains(l.BodyTypeId));
            if (fuelTypeId is not null) q = q.Where(l => l.FuelTypeId == fuelTypeId);
            else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) q = q.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
            return q;
        }
        IQueryable<Listing> ApplyWithoutTransmission(IQueryable<Listing> q) {
            if (makeId is not null) q = q.Where(l => l.MakeId == makeId);
            else if (makeIds is not null && makeIds.Length > 0) q = q.Where(l => makeIds.Contains(l.MakeId));
            if (modelId is not null) q = q.Where(l => l.ModelId == modelId);
            else if (modelIds is not null && modelIds.Length > 0) q = q.Where(l => modelIds.Contains(l.ModelId));
            if (variantId is not null) q = q.Where(l => l.VariantId == variantId);
            else if (variantIds is not null && variantIds.Length > 0) q = q.Where(l => variantIds.Contains(l.VariantId));
            if (bodyTypeId is not null) q = q.Where(l => l.BodyTypeId == bodyTypeId);
            else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) q = q.Where(l => bodyTypeIds.Contains(l.BodyTypeId));
            if (fuelTypeId is not null) q = q.Where(l => l.FuelTypeId == fuelTypeId);
            else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) q = q.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
            return q;
        }
        IQueryable<Listing> ApplyWithoutBody(IQueryable<Listing> q) {
            if (makeId is not null) q = q.Where(l => l.MakeId == makeId);
            else if (makeIds is not null && makeIds.Length > 0) q = q.Where(l => makeIds.Contains(l.MakeId));
            if (modelId is not null) q = q.Where(l => l.ModelId == modelId);
            else if (modelIds is not null && modelIds.Length > 0) q = q.Where(l => modelIds.Contains(l.ModelId));
            if (variantId is not null) q = q.Where(l => l.VariantId == variantId);
            else if (variantIds is not null && variantIds.Length > 0) q = q.Where(l => variantIds.Contains(l.VariantId));
            if (transmissionId is not null) q = q.Where(l => l.TransmissionId == transmissionId);
            else if (transmissionIds is not null && transmissionIds.Length > 0) q = q.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));
            if (fuelTypeId is not null) q = q.Where(l => l.FuelTypeId == fuelTypeId);
            else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) q = q.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));
            return q;
        }
        IQueryable<Listing> ApplyWithoutFuel(IQueryable<Listing> q) {
            if (makeId is not null) q = q.Where(l => l.MakeId == makeId);
            else if (makeIds is not null && makeIds.Length > 0) q = q.Where(l => makeIds.Contains(l.MakeId));
            if (modelId is not null) q = q.Where(l => l.ModelId == modelId);
            else if (modelIds is not null && modelIds.Length > 0) q = q.Where(l => modelIds.Contains(l.ModelId));
            if (variantId is not null) q = q.Where(l => l.VariantId == variantId);
            else if (variantIds is not null && variantIds.Length > 0) q = q.Where(l => variantIds.Contains(l.VariantId));
            if (transmissionId is not null) q = q.Where(l => l.TransmissionId == transmissionId);
            else if (transmissionIds is not null && transmissionIds.Length > 0) q = q.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));
            if (bodyTypeId is not null) q = q.Where(l => l.BodyTypeId == bodyTypeId);
            else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) q = q.Where(l => bodyTypeIds.Contains(l.BodyTypeId));
            return q;
        }
        IQueryable<Listing> ApplyWithoutYear(IQueryable<Listing> q) {
            if (makeId is not null) q = q.Where(l => l.MakeId == makeId);
            else if (makeIds is not null && makeIds.Length > 0) q = q.Where(l => makeIds.Contains(l.MakeId));
            if (modelId is not null) q = q.Where(l => l.ModelId == modelId);
            else if (modelIds is not null && modelIds.Length > 0) q = q.Where(l => modelIds.Contains(l.ModelId));
            if (variantId is not null) q = q.Where(l => l.VariantId == variantId);
            else if (variantIds is not null && variantIds.Length > 0) q = q.Where(l => variantIds.Contains(l.VariantId));
            if (transmissionId is not null) q = q.Where(l => l.TransmissionId == transmissionId);
            else if (transmissionIds is not null && transmissionIds.Length > 0) q = q.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));
            if (bodyTypeId is not null) q = q.Where(l => l.BodyTypeId == bodyTypeId);
            else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) q = q.Where(l => bodyTypeIds.Contains(l.BodyTypeId));
            if (fuelTypeId is not null) q = q.Where(l => l.FuelTypeId == fuelTypeId);
            else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) q = q.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));
            return q;
        }
        IQueryable<Listing> ApplyWithoutPrice(IQueryable<Listing> q) {
            if (makeId is not null) q = q.Where(l => l.MakeId == makeId);
            else if (makeIds is not null && makeIds.Length > 0) q = q.Where(l => makeIds.Contains(l.MakeId));
            if (modelId is not null) q = q.Where(l => l.ModelId == modelId);
            else if (modelIds is not null && modelIds.Length > 0) q = q.Where(l => modelIds.Contains(l.ModelId));
            if (variantId is not null) q = q.Where(l => l.VariantId == variantId);
            else if (variantIds is not null && variantIds.Length > 0) q = q.Where(l => variantIds.Contains(l.VariantId));
            if (transmissionId is not null) q = q.Where(l => l.TransmissionId == transmissionId);
            else if (transmissionIds is not null && transmissionIds.Length > 0) q = q.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));
            if (bodyTypeId is not null) q = q.Where(l => l.BodyTypeId == bodyTypeId);
            else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) q = q.Where(l => bodyTypeIds.Contains(l.BodyTypeId));
            if (fuelTypeId is not null) q = q.Where(l => l.FuelTypeId == fuelTypeId);
            else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) q = q.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);
            return q;
        }
        IQueryable<Listing> ApplyWithoutMileage(IQueryable<Listing> q) {
            if (makeId is not null) q = q.Where(l => l.MakeId == makeId);
            else if (makeIds is not null && makeIds.Length > 0) q = q.Where(l => makeIds.Contains(l.MakeId));
            if (modelId is not null) q = q.Where(l => l.ModelId == modelId);
            else if (modelIds is not null && modelIds.Length > 0) q = q.Where(l => modelIds.Contains(l.ModelId));
            if (variantId is not null) q = q.Where(l => l.VariantId == variantId);
            else if (variantIds is not null && variantIds.Length > 0) q = q.Where(l => variantIds.Contains(l.VariantId));
            if (transmissionId is not null) q = q.Where(l => l.TransmissionId == transmissionId);
            else if (transmissionIds is not null && transmissionIds.Length > 0) q = q.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));
            if (bodyTypeId is not null) q = q.Where(l => l.BodyTypeId == bodyTypeId);
            else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) q = q.Where(l => bodyTypeIds.Contains(l.BodyTypeId));
            if (fuelTypeId is not null) q = q.Where(l => l.FuelTypeId == fuelTypeId);
            else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) q = q.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));
            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            return q;
        }

        var makeCounts = await ApplyWithoutMake(Base())
            .GroupBy(l => l.MakeId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        var modelCounts = await ApplyWithoutModel(Base())
            .GroupBy(l => l.ModelId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        var transCounts = await ApplyWithoutTransmission(Base())
            .Where(l => l.TransmissionId != null)
            .GroupBy(l => l.TransmissionId!.Value)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        var bodyCounts = await ApplyWithoutBody(Base())
            .GroupBy(l => l.BodyTypeId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        var fuelCounts = await ApplyWithoutFuel(Base())
            .Where(l => l.FuelTypeId != null)
            .GroupBy(l => l.FuelTypeId!.Value)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        // Seats and Doors (exclude filtering by the facet under evaluation)
        IQueryable<Listing> ApplyWithoutSeats(IQueryable<Listing> q) {
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
            return q;
        }
        IQueryable<Listing> ApplyWithoutDoors(IQueryable<Listing> q) {
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
            return q;
        }
        var seatCounts = await ApplyWithoutSeats(Base())
            .Where(l => l.SeatsSnapshot != null && l.SeatsSnapshot.Value > 0)
            .GroupBy(l => l.SeatsSnapshot!.Value)
            .Select(g => new { Id = (int)g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        var doorCounts = await ApplyWithoutDoors(Base())
            .Where(l => l.DoorsSnapshot != null && l.DoorsSnapshot.Value > 0)
            .GroupBy(l => l.DoorsSnapshot!.Value)
            .Select(g => new { Id = (int)g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        var yearCounts = await ApplyWithoutYear(BaseWithoutYear())
            .GroupBy(l => l.Year)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        // Bucketed price counts (step = 1000)
        const int priceStep = 1000;
        var priceCounts = await ApplyWithoutPrice(BaseWithoutPrice())
            .GroupBy(l => ((int)l.Price / priceStep) * priceStep)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        // Bucketed mileage counts (fixed step = 5000)
        const int mileageStep = 5000;
        var mileageCounts = await ApplyWithoutMileage(BaseWithoutMileage())
            .GroupBy(l => (l.Mileage / mileageStep) * mileageStep)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);

        // Exact mileage counts for From dropdown increments
        var mileageExactCounts = await ApplyWithoutMileage(BaseWithoutMileage())
            .GroupBy(l => l.Mileage)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);

        // Compute minimum mileage across current filters (excluding mileage itself)
        int? minMileage = null;
        var qForMinMileage = ApplyWithoutMileage(BaseWithoutMileage());
        if (await qForMinMileage.AnyAsync())
        {
            minMileage = await qForMinMileage.MinAsync(l => (int?)l.Mileage);
        }

        var dto = new FacetCountsDto
        {
            Makes = makeCounts,
            Models = modelCounts,
            Transmissions = transCounts,
            Bodies = bodyCounts,
            Fuels = fuelCounts,
            Seats = seatCounts,
            Doors = doorCounts,
            Years = yearCounts,
            Prices = priceCounts,
            Mileages = mileageCounts,
            PriceStep = priceStep,
            MileageStep = mileageStep,
            MinMileage = minMileage,
            MileageExact = mileageExactCounts
        };
        return dto;
    }

    [HttpGet("search")]
    public async Task<ActionResult<PaginatedResponse<ListingDto>>> Search(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? sortBy = null, // "price" or "year"
        [FromQuery] string? sortDirection = null, // "asc" or "desc"
        [FromQuery] int? makeId = null,
        [FromQuery(Name = "makeIds")] int[]? makeIds = null,
        [FromQuery] int? modelId = null,
        [FromQuery(Name = "modelIds")] int[]? modelIds = null,
        [FromQuery] int? variantId = null,
        [FromQuery(Name = "variantIds")] int[]? variantIds = null,
        [FromQuery] int? transmissionId = null,
        [FromQuery(Name = "transmissionIds")] int[]? transmissionIds = null,
        [FromQuery] int? bodyTypeId = null,
        [FromQuery(Name = "bodyTypeIds")] int[]? bodyTypeIds = null,
        [FromQuery] int? fuelTypeId = null,
        [FromQuery(Name = "fuelTypeIds")] int[]? fuelTypeIds = null,
        [FromQuery] decimal? priceMin = null,
        [FromQuery] decimal? priceMax = null,
        [FromQuery] int? yearMin = null,
        [FromQuery] int? yearMax = null,
        [FromQuery] int? mileageMin = null,
        [FromQuery] int? mileageMax = null,
        [FromQuery(Name = "seats")] int[]? seats = null,
        [FromQuery(Name = "doors")] int[]? doors = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 12;

        var query = context.Listings.Include(l => l.Images).AsQueryable();
        if (priceMin is not null) query = query.Where(l => l.Price >= priceMin);
        if (priceMax is not null) query = query.Where(l => l.Price <= priceMax);
        if (yearMin is not null) query = query.Where(l => l.Year >= yearMin);
        if (yearMax is not null) query = query.Where(l => l.Year <= yearMax);
        if (mileageMin is not null) query = query.Where(l => l.Mileage >= mileageMin);
        if (mileageMax is not null) query = query.Where(l => l.Mileage <= mileageMax);
        if (seats is not null && seats.Length > 0) query = query.Where(l => l.SeatsSnapshot != null && seats.Contains(l.SeatsSnapshot.Value));
        if (doors is not null && doors.Length > 0) query = query.Where(l => l.DoorsSnapshot != null && doors.Contains(l.DoorsSnapshot.Value));
        if (makeId is not null) query = query.Where(l => l.MakeId == makeId);
        else if (makeIds is not null && makeIds.Length > 0) query = query.Where(l => makeIds.Contains(l.MakeId));

        if (modelId is not null) query = query.Where(l => l.ModelId == modelId);
        else if (modelIds is not null && modelIds.Length > 0) query = query.Where(l => modelIds.Contains(l.ModelId));

        if (variantId is not null) query = query.Where(l => l.VariantId == variantId);
        else if (variantIds is not null && variantIds.Length > 0) query = query.Where(l => variantIds.Contains(l.VariantId));

        if (transmissionId is not null) query = query.Where(l => l.TransmissionId == transmissionId);
        else if (transmissionIds is not null && transmissionIds.Length > 0) query = query.Where(l => transmissionIds.Contains(l.TransmissionId ?? 0));

        if (bodyTypeId is not null) query = query.Where(l => l.BodyTypeId == bodyTypeId);
        else if (bodyTypeIds is not null && bodyTypeIds.Length > 0) query = query.Where(l => bodyTypeIds.Contains(l.BodyTypeId));

        if (fuelTypeId is not null) query = query.Where(l => l.FuelTypeId == fuelTypeId);
        else if (fuelTypeIds is not null && fuelTypeIds.Length > 0) query = query.Where(l => fuelTypeIds.Contains(l.FuelTypeId ?? 0));

        // Sorting
        var dir = (sortDirection ?? "asc").ToLowerInvariant();
        var by = (sortBy ?? "").ToLowerInvariant();
        if (by == "price")
            query = dir == "desc" ? query.OrderByDescending(l => l.Price) : query.OrderBy(l => l.Price);
        else if (by == "year")
            query = dir == "desc" ? query.OrderByDescending(l => l.Year) : query.OrderBy(l => l.Year);
        else
            query = query.OrderBy(l => l.Id);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        if (totalPages == 0) totalPages = 1;
        if (page > totalPages) page = totalPages;

        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        var dtos = items.Select(mapper.Map<ListingDto>).ToList();

        // Attach features
        var ids = dtos.Select(d => d.Id).ToArray();
        var featuresByListing = await context.ListingFeatures
            .Where(f => ids.Contains(f.ListingId))
            .GroupBy(f => f.ListingId)
            .Select(g => new { ListingId = g.Key, FeatureIds = g.Select(x => x.FeatureId).ToArray() })
            .ToListAsync();
        var dict = featuresByListing.ToDictionary(x => x.ListingId, x => x.FeatureIds);
        foreach (var d in dtos)
        {
            dict.TryGetValue(d.Id, out var fids);
            d.FeatureIds = fids;
        }

        var resp = new PaginatedResponse<ListingDto>
        {
            Data = dtos,
            TotalCount = totalCount,
            TotalPages = totalPages,
            CurrentPage = page,
            PageSize = pageSize,
            HasNextPage = page < totalPages,
            HasPreviousPage = page > 1
        };
        return resp;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ListingDto>> Get(int id)
    {
        var entity = await context.Listings.Include(l => l.Images).FirstOrDefaultAsync(l => l.Id == id);
        if (entity is null) return NotFound();
        var dto = mapper.Map<ListingDto>(entity);
        dto.FeatureIds = await context.ListingFeatures.Where(f => f.ListingId == id).Select(f => f.FeatureId).ToArrayAsync();
        return dto;
    }

    [HttpPost]
    public async Task<ActionResult<ListingDto>> Create(CreateListingDto dto)
    {
        var listing = mapper.Map<Listing>(dto);
        // Only populate from server if client did not supply snapshots
        if (string.IsNullOrWhiteSpace(listing.MakeName) || string.IsNullOrWhiteSpace(listing.ModelName) || string.IsNullOrWhiteSpace(listing.VariantName))
        {
            await catalog.PopulateSnapshotsAsync(listing);
        }
        // Persist selected features with snapshot of feature metadata from CatalogService
        var featureIds = dto.FeatureIds ?? Array.Empty<int>();
        context.Listings.Add(listing);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create listing");

        if (featureIds.Length > 0)
        {
            foreach (var fid in featureIds.Distinct())
            {
                var f = await catalog.GetFeatureAsync(fid);
                if (f is null) return BadRequest($"Unknown featureId {fid}");
                context.ListingFeatures.Add(new ListingFeature
                {
                    ListingId = listing.Id,
                    FeatureId = f.Id,
                    FeatureName = f.Name,
                    FeatureDescription = f.Description
                });
            }
            await context.SaveChangesAsync();
        }
        var result = mapper.Map<ListingDto>(listing);
        return CreatedAtAction(nameof(Get), new { id = listing.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateListingDto dto)
    {
        var listing = await context.Listings.FindAsync(id);
        if (listing is null) return NotFound();
        mapper.Map(dto, listing);
        // Refresh option snapshots if explicitly changed
        if (dto.TransmissionId.HasValue)
        {
            listing.TransmissionName = await catalog.GetTransmissionNameAsync(dto.TransmissionId.Value) ?? listing.TransmissionName;
        }
        if (dto.FuelTypeId.HasValue)
        {
            listing.FuelTypeName = await catalog.GetFuelTypeNameAsync(dto.FuelTypeId.Value) ?? listing.FuelTypeName;
        }
        if (dto.BodyTypeId.HasValue)
        {
            listing.BodyTypeName = await catalog.GetBodyTypeNameAsync(dto.BodyTypeId.Value) ?? listing.BodyTypeName;
        }

        // Refresh other snapshots if core identifiers changed and client did not supply new snapshots
        if (string.IsNullOrWhiteSpace(listing.MakeName) || string.IsNullOrWhiteSpace(listing.ModelName) || string.IsNullOrWhiteSpace(listing.VariantName))
        {
            await catalog.PopulateSnapshotsAsync(listing);
        }
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to update listing");

        // Update features if provided
        if (dto.FeatureIds is not null)
        {
            var existing = await context.ListingFeatures.Where(x => x.ListingId == id).ToListAsync();
            var newSet = dto.FeatureIds.Distinct().ToHashSet();
            // Remove not in new set
            var toRemove = existing.Where(e => !newSet.Contains(e.FeatureId)).ToList();
            if (toRemove.Count > 0) context.ListingFeatures.RemoveRange(toRemove);
            // Add missing ones
            var existingIds = existing.Select(e => e.FeatureId).ToHashSet();
            foreach (var fid in newSet)
            {
                if (existingIds.Contains(fid)) continue;
                var f = await catalog.GetFeatureAsync(fid);
                if (f is null) continue;
                context.ListingFeatures.Add(new ListingFeature
                {
                    ListingId = id,
                    FeatureId = f.Id,
                    FeatureName = f.Name,
                    FeatureDescription = f.Description
                });
            }
            await context.SaveChangesAsync();
        }
        return Ok();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var listing = await context.Listings.FindAsync(id);
        if (listing is null) return NotFound();
        context.Listings.Remove(listing);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete listing");
    }
}