using AutoMapper;
using ListingService.Data;
using ListingService.DTOs;
using ListingService.Entities;
// using ListingService.Services; // removed unused catalog lookup
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace ListingService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController(ListingDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ListingDto>>> GetAll(
        [FromQuery] string? makeCode,
        [FromQuery(Name = "makeCodes")] string[]? makeCodes,
        [FromQuery] string? modelCode,
        [FromQuery(Name = "modelCodes")] string[]? modelCodes,
        [FromQuery] string? variantCode,
        [FromQuery(Name = "variantCodes")] string[]? variantCodes,
        [FromQuery] string? transmissionTypeCode,
        [FromQuery(Name = "transmissionTypeCodes")] string[]? transmissionTypeCodes,
        [FromQuery] string? bodyTypeCode,
        [FromQuery(Name = "bodyTypeCodes")] string[]? bodyTypeCodes,
        [FromQuery] string? fuelTypeCode,
        [FromQuery(Name = "fuelTypeCodes")] string[]? fuelTypeCodes,
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
        if (!string.IsNullOrWhiteSpace(makeCode)) query = query.Where(l => l.MakeCode == makeCode);
        else if (makeCodes is not null && makeCodes.Length > 0) query = query.Where(l => makeCodes.Contains(l.MakeCode!));

        if (!string.IsNullOrWhiteSpace(modelCode)) query = query.Where(l => l.ModelCode == modelCode);
        else if (modelCodes is not null && modelCodes.Length > 0) query = query.Where(l => modelCodes.Contains(l.ModelCode!));

        if (!string.IsNullOrWhiteSpace(variantCode)) query = query.Where(l => l.VariantCode == variantCode);
        else if (variantCodes is not null && variantCodes.Length > 0) query = query.Where(l => variantCodes.Contains(l.VariantCode!));

        if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) query = query.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
        else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) query = query.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));

        if (!string.IsNullOrWhiteSpace(bodyTypeCode)) query = query.Where(l => l.BodyTypeCode == bodyTypeCode);
        else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) query = query.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));

        if (!string.IsNullOrWhiteSpace(fuelTypeCode)) query = query.Where(l => l.FuelTypeCode == fuelTypeCode);
        else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) query = query.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));
        var items = await query.ToListAsync();
        var dtos = items.Select(mapper.Map<ListingDto>).ToList();
        var featuresByListing = await context.ListingFeatures
            .GroupBy(f => f.ListingId)
            .Select(g => new { ListingId = g.Key, FeatureCodes = g.Select(x => x.FeatureCode).ToArray() })
            .ToListAsync();
        var dict = featuresByListing.ToDictionary(x => x.ListingId, x => x.FeatureCodes);
        foreach (var d in dtos)
        {
            dict.TryGetValue(d.Id, out var codes);
            d.FeatureCodes = codes;
        }
        return dtos;
    }

    [HttpGet("facets")]
    public async Task<ActionResult<FacetCountsDto>> GetFacetCounts(
        [FromQuery] string? makeCode,
        [FromQuery(Name = "makeCodes")] string[]? makeCodes,
        [FromQuery] string? modelCode,
        [FromQuery(Name = "modelCodes")] string[]? modelCodes,
        [FromQuery] string? variantCode,
        [FromQuery(Name = "variantCodes")] string[]? variantCodes,
        [FromQuery] string? transmissionTypeCode,
        [FromQuery(Name = "transmissionTypeCodes")] string[]? transmissionTypeCodes,
        [FromQuery] string? bodyTypeCode,
        [FromQuery(Name = "bodyTypeCodes")] string[]? bodyTypeCodes,
        [FromQuery] string? fuelTypeCode,
        [FromQuery(Name = "fuelTypeCodes")] string[]? fuelTypeCodes,
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
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));
            return q;
        }
        IQueryable<Listing> BaseWithoutYear() {
            var q = context.Listings.AsNoTracking();
            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));
            return q;
        }
        IQueryable<Listing> BaseWithoutPrice() {
            var q = context.Listings.AsNoTracking();
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));
            return q;
        }
        IQueryable<Listing> BaseWithoutMileage() {
            var q = context.Listings.AsNoTracking();
            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));
            return q;
        }

        // Apply filters except the facet under evaluation
        IQueryable<Listing> ApplyWithoutMake(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));
            return q;
        }
        IQueryable<Listing> ApplyWithoutModel(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));
            return q;
        }
        IQueryable<Listing> ApplyWithoutTransmission(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));
            if (seats is not null && seats.Length > 0) q = q.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));
            if (doors is not null && doors.Length > 0) q = q.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));
            return q;
        }
        IQueryable<Listing> ApplyWithoutBody(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));
            return q;
        }
        IQueryable<Listing> ApplyWithoutFuel(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            return q;
        }
        IQueryable<Listing> ApplyWithoutYear(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));
            return q;
        }
        IQueryable<Listing> ApplyWithoutPrice(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);
            return q;
        }
        IQueryable<Listing> ApplyWithoutMileage(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));
            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            return q;
        }

        var makeCounts = await ApplyWithoutMake(Base())
            .Where(l => l.MakeCode != null)
            .GroupBy(l => l.MakeCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count);
        var modelCounts = await ApplyWithoutModel(Base())
            .Where(l => l.ModelCode != null)
            .GroupBy(l => l.ModelCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count);
        var transCounts = await ApplyWithoutTransmission(Base())
            .Where(l => l.TransmissionTypeCode != null)
            .GroupBy(l => l.TransmissionTypeCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count);
        var bodyCounts = await ApplyWithoutBody(Base())
            .Where(l => l.BodyTypeCode != null)
            .GroupBy(l => l.BodyTypeCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count);
        var fuelCounts = await ApplyWithoutFuel(Base())
            .Where(l => l.FuelTypeCode != null)
            .GroupBy(l => l.FuelTypeCode!)
            .Select(g => new { Code = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Code, x => x.Count);
        // Seats and Doors (exclude filtering by the facet under evaluation)
        IQueryable<Listing> ApplyWithoutSeats(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));

            if (doors is not null && doors.Length > 0) q = q.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));

            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);

            return q;
        }
        IQueryable<Listing> ApplyWithoutDoors(IQueryable<Listing> q) {
            if (!string.IsNullOrWhiteSpace(makeCode)) q = q.Where(l => l.MakeCode == makeCode);
            else if (makeCodes is not null && makeCodes.Length > 0) q = q.Where(l => makeCodes.Contains(l.MakeCode!));
            if (!string.IsNullOrWhiteSpace(modelCode)) q = q.Where(l => l.ModelCode == modelCode);
            else if (modelCodes is not null && modelCodes.Length > 0) q = q.Where(l => modelCodes.Contains(l.ModelCode!));
            if (!string.IsNullOrWhiteSpace(variantCode)) q = q.Where(l => l.VariantCode == variantCode);
            else if (variantCodes is not null && variantCodes.Length > 0) q = q.Where(l => variantCodes.Contains(l.VariantCode!));
            if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) q = q.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
            else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) q = q.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));
            if (!string.IsNullOrWhiteSpace(bodyTypeCode)) q = q.Where(l => l.BodyTypeCode == bodyTypeCode);
            else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) q = q.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));
            if (!string.IsNullOrWhiteSpace(fuelTypeCode)) q = q.Where(l => l.FuelTypeCode == fuelTypeCode);
            else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) q = q.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));

            if (seats is not null && seats.Length > 0) q = q.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));

            if (priceMin is not null) q = q.Where(l => l.Price >= priceMin);
            if (priceMax is not null) q = q.Where(l => l.Price <= priceMax);
            if (yearMin is not null) q = q.Where(l => l.Year >= yearMin);
            if (yearMax is not null) q = q.Where(l => l.Year <= yearMax);
            if (mileageMin is not null) q = q.Where(l => l.Mileage >= mileageMin);
            if (mileageMax is not null) q = q.Where(l => l.Mileage <= mileageMax);

            return q;
        }
        var seatCounts = await ApplyWithoutSeats(Base())
            .Where(l => l.Seats != null && l.Seats.Value > 0)
            .GroupBy(l => l.Seats!.Value)
            .Select(g => new { Id = (int)g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count);
        var doorCounts = await ApplyWithoutDoors(Base())
            .Where(l => l.Doors != null && l.Doors.Value > 0)
            .GroupBy(l => l.Doors!.Value)
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

        // Labels & parent mappings derived from current filtered dataset
        var makeLabels = await Base()
            .Where(l => l.MakeCode != null)
            .GroupBy(l => new { l.MakeCode, l.MakeName })
            .Select(g => new { Code = g.Key.MakeCode!, Name = g.Key.MakeName })
            .ToDictionaryAsync(x => x.Code, x => x.Name ?? string.Empty);

        var modelLabels = await Base()
            .Where(l => l.ModelCode != null)
            .GroupBy(l => new { l.ModelCode, l.ModelName })
            .Select(g => new { Code = g.Key.ModelCode!, Name = g.Key.ModelName })
            .ToDictionaryAsync(x => x.Code, x => x.Name ?? string.Empty);

        var modelMakeCodes = await Base()
            .Where(l => l.ModelCode != null && l.MakeCode != null)
            .GroupBy(l => new { l.ModelCode, l.MakeCode })
            .Select(g => new { ModelCode = g.Key.ModelCode!, MakeCode = g.Key.MakeCode! })
            .ToDictionaryAsync(x => x.ModelCode, x => x.MakeCode);

        var transmissionLabels = await Base()
            .Where(l => l.TransmissionTypeCode != null)
            .GroupBy(l => new { l.TransmissionTypeCode, l.TransmissionTypeName })
            .Select(g => new { Code = g.Key.TransmissionTypeCode!, Name = g.Key.TransmissionTypeName })
            .ToDictionaryAsync(x => x.Code, x => x.Name ?? string.Empty);

        var bodyLabels = await Base()
            .Where(l => l.BodyTypeCode != null)
            .GroupBy(l => new { l.BodyTypeCode, l.BodyTypeName })
            .Select(g => new { Code = g.Key.BodyTypeCode!, Name = g.Key.BodyTypeName })
            .ToDictionaryAsync(x => x.Code, x => x.Name ?? string.Empty);

        var fuelLabels = await Base()
            .Where(l => l.FuelTypeCode != null)
            .GroupBy(l => new { l.FuelTypeCode, l.FuelTypeName })
            .Select(g => new { Code = g.Key.FuelTypeCode!, Name = g.Key.FuelTypeName })
            .ToDictionaryAsync(x => x.Code, x => x.Name ?? string.Empty);

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
            MileageExact = mileageExactCounts,
            MakeLabels = makeLabels,
            ModelLabels = modelLabels,
            ModelMakeCodes = modelMakeCodes,
            TransmissionLabels = transmissionLabels,
            BodyLabels = bodyLabels,
            FuelLabels = fuelLabels
        };
        return dto;
    }

    [HttpGet("search")]
    public async Task<ActionResult<PaginatedResponse<ListingDto>>> Search(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? sortBy = null, // "price" or "year"
        [FromQuery] string? sortDirection = null, // "asc" or "desc"
        [FromQuery] string? makeCode = null,
        [FromQuery(Name = "makeCodes")] string[]? makeCodes = null,
        [FromQuery] string? modelCode = null,
        [FromQuery(Name = "modelCodes")] string[]? modelCodes = null,
        [FromQuery] string? variantCode = null,
        [FromQuery(Name = "variantCodes")] string[]? variantCodes = null,
        [FromQuery] string? transmissionTypeCode = null,
        [FromQuery(Name = "transmissionTypeCodes")] string[]? transmissionTypeCodes = null,
        [FromQuery] string? bodyTypeCode = null,
        [FromQuery(Name = "bodyTypeCodes")] string[]? bodyTypeCodes = null,
        [FromQuery] string? fuelTypeCode = null,
        [FromQuery(Name = "fuelTypeCodes")] string[]? fuelTypeCodes = null,
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
        if (seats is not null && seats.Length > 0) query = query.Where(l => l.Seats != null && seats.Contains(l.Seats.Value));
        if (doors is not null && doors.Length > 0) query = query.Where(l => l.Doors != null && doors.Contains(l.Doors.Value));
        if (!string.IsNullOrWhiteSpace(makeCode)) query = query.Where(l => l.MakeCode == makeCode);
        else if (makeCodes is not null && makeCodes.Length > 0) query = query.Where(l => makeCodes.Contains(l.MakeCode!));

        if (!string.IsNullOrWhiteSpace(modelCode)) query = query.Where(l => l.ModelCode == modelCode);
        else if (modelCodes is not null && modelCodes.Length > 0) query = query.Where(l => modelCodes.Contains(l.ModelCode!));

        if (!string.IsNullOrWhiteSpace(variantCode)) query = query.Where(l => l.VariantCode == variantCode);
        else if (variantCodes is not null && variantCodes.Length > 0) query = query.Where(l => variantCodes.Contains(l.VariantCode!));

        if (!string.IsNullOrWhiteSpace(transmissionTypeCode)) query = query.Where(l => l.TransmissionTypeCode == transmissionTypeCode);
        else if (transmissionTypeCodes is not null && transmissionTypeCodes.Length > 0) query = query.Where(l => transmissionTypeCodes.Contains(l.TransmissionTypeCode!));

        if (!string.IsNullOrWhiteSpace(bodyTypeCode)) query = query.Where(l => l.BodyTypeCode == bodyTypeCode);
        else if (bodyTypeCodes is not null && bodyTypeCodes.Length > 0) query = query.Where(l => bodyTypeCodes.Contains(l.BodyTypeCode!));

        if (!string.IsNullOrWhiteSpace(fuelTypeCode)) query = query.Where(l => l.FuelTypeCode == fuelTypeCode);
        else if (fuelTypeCodes is not null && fuelTypeCodes.Length > 0) query = query.Where(l => fuelTypeCodes.Contains(l.FuelTypeCode!));

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
            .Select(g => new { ListingId = g.Key, FeatureCodes = g.Select(x => x.FeatureCode).ToArray() })
            .ToListAsync();
        var dict = featuresByListing.ToDictionary(x => x.ListingId, x => x.FeatureCodes);
        foreach (var d in dtos)
        {
            dict.TryGetValue(d.Id, out var codes);
            d.FeatureCodes = codes;
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
        dto.FeatureCodes = await context.ListingFeatures.Where(f => f.ListingId == id).Select(f => f.FeatureCode).ToArrayAsync();
        return dto;
    }

    [HttpPost]
    public async Task<ActionResult<ListingDto>> Create(CreateListingDto dto)
    {
        var listing = mapper.Map<Listing>(dto);
        // Ensure Seats and Doors are persisted from payload
        listing.Seats = dto.Seats;
        listing.Doors = dto.Doors;
        // Snapshots and codes are provided by client; no catalog lookup required
        // Persist selected features with snapshot of feature metadata from CatalogService
        var featureCodes = dto.FeatureCodes ?? Array.Empty<string>();
        context.Listings.Add(listing);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create listing");

        if (featureCodes.Length > 0)
        {
            foreach (var code in featureCodes.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                context.ListingFeatures.Add(new ListingFeature
                {
                    ListingId = listing.Id,
                    FeatureCode = code,
                    FeatureName = code
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
        // Snapshots and codes are provided by client; no catalog lookup required

        // Refresh other snapshots if core identifiers changed and client did not supply new snapshots
        // Accept provided snapshot labels; if missing, remain null
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to update listing");

        // Update features if provided
        if (dto.FeatureCodes is not null)
        {
            var existing = await context.ListingFeatures.Where(x => x.ListingId == id).ToListAsync();
            var newSet = dto.FeatureCodes.Distinct(StringComparer.OrdinalIgnoreCase).ToHashSet(StringComparer.OrdinalIgnoreCase);
            // Remove not in new set
            var toRemove = existing.Where(e => !newSet.Contains(e.FeatureCode)).ToList();
            if (toRemove.Count > 0) context.ListingFeatures.RemoveRange(toRemove);
            // Add missing ones
            var existingCodes = existing.Select(e => e.FeatureCode).ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var code in newSet)
            {
                if (existingCodes.Contains(code)) continue;
                context.ListingFeatures.Add(new ListingFeature
                {
                    ListingId = id,
                    FeatureCode = code,
                    FeatureName = code
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