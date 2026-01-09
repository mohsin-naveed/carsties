using AutoMapper;
using ListingService.Data;
using ListingService.DTOs;
using ListingService.Entities;
using ListingService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ListingService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController(ListingDbContext context, IMapper mapper, ICatalogLookup catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ListingDto>>> GetAll()
    {
        var items = await context.Listings.Include(l => l.Images).ToListAsync();
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
        // Refresh snapshots if core identifiers changed and client did not supply new snapshots
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