using AutoMapper;
using AutoMapper.QueryableExtensions;
using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VariantFeaturesController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    // Context endpoint removed; page deleted
    [HttpGet]
    public async Task<ActionResult<List<VariantFeatureDto>>> GetAll([FromQuery] int? variantId, [FromQuery] int? featureId)
    {
        var query = context.VariantFeatures.AsQueryable();
        if (variantId.HasValue) query = query.Where(x => x.VariantId == variantId);
        if (featureId.HasValue) query = query.Where(x => x.FeatureId == featureId);
        return await query
            .ProjectTo<VariantFeatureDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{variantId:int}/{featureId:int}")]
    public async Task<ActionResult<VariantFeatureDto>> Get(int variantId, int featureId)
    {
        var entity = await context.VariantFeatures.FindAsync(variantId, featureId);
        return entity is null ? NotFound() : mapper.Map<VariantFeatureDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<VariantFeatureDto>> Create(CreateVariantFeatureDto dto)
    {
        var variantExists = await context.Variants.AnyAsync(x => x.Id == dto.VariantId);
        var featureExists = await context.Features.AnyAsync(x => x.Id == dto.FeatureId);
        if (!variantExists || !featureExists) return BadRequest("Invalid VariantId or FeatureId");
        var exists = await context.VariantFeatures.AnyAsync(x => x.VariantId == dto.VariantId && x.FeatureId == dto.FeatureId);
        if (exists) return Conflict("Mapping already exists");
        var entity = new VariantFeature
        {
            VariantId = dto.VariantId,
            FeatureId = dto.FeatureId,
            IsStandard = dto.IsStandard
        };
        context.VariantFeatures.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create mapping");
        var result = mapper.Map<VariantFeatureDto>(entity);
        return CreatedAtAction(nameof(Get), new { variantId = entity.VariantId, featureId = entity.FeatureId }, result);
    }

    [HttpPut("{variantId:int}/{featureId:int}")]
    public async Task<ActionResult> Update(int variantId, int featureId, UpdateVariantFeatureDto dto)
    {
        var entity = await context.VariantFeatures.FindAsync(variantId, featureId);
        if (entity is null) return NotFound();
        if (dto.IsStandard.HasValue) entity.IsStandard = dto.IsStandard.Value;
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update mapping");
    }

    [HttpDelete("{variantId:int}/{featureId:int}")]
    public async Task<ActionResult> Delete(int variantId, int featureId)
    {
        var entity = await context.VariantFeatures.FindAsync(variantId, featureId);
        if (entity is null) return NotFound();
        context.VariantFeatures.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete mapping");
    }
}
