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
    [HttpGet("context")]
    public async Task<ActionResult<VariantFeaturesContextDto>> GetContext([FromQuery] int? makeId, [FromQuery] int? modelId, [FromQuery] int? generationId)
    {
        var makesQuery = context.Makes.AsQueryable();
        var modelsQuery = context.Models.AsQueryable();
        var generationsQuery = context.Generations.AsQueryable();
        var variantsQuery = context.Variants.AsQueryable();
        var featuresQuery = context.Features.AsQueryable();

        if (makeId.HasValue)
        {
            modelsQuery = modelsQuery.Where(m => m.MakeId == makeId);
        }
        if (modelId.HasValue)
        {
            modelsQuery = modelsQuery.Where(m => m.Id == modelId);
            generationsQuery = generationsQuery.Where(g => g.ModelId == modelId);
        }
        if (generationId.HasValue)
        {
            variantsQuery = variantsQuery.Where(v => v.GenerationId == generationId);
        }

        var makes = await makesQuery.OrderBy(x => x.Name).ProjectTo<MakeDto>(mapper.ConfigurationProvider).ToListAsync();
        var models = await modelsQuery.OrderBy(x => x.Name).ProjectTo<ModelDto>(mapper.ConfigurationProvider).ToListAsync();
        var generations = await generationsQuery.OrderBy(x => x.Name).ProjectTo<GenerationDto>(mapper.ConfigurationProvider).ToListAsync();
        var variants = await variantsQuery
            .OrderBy(x => x.Name)
            .Select(v => new VariantDto(
                v.Id,
                v.Name,
                v.Engine,
                v.TransmissionId,
                v.TransmissionRef != null ? v.TransmissionRef.Name : null,
                v.FuelTypeId,
                v.FuelTypeRef != null ? v.FuelTypeRef.Name : null,
                v.GenerationId))
            .ToListAsync();
        var features = await featuresQuery.OrderBy(x => x.Name).ProjectTo<FeatureDto>(mapper.ConfigurationProvider).ToListAsync();

        return Ok(new VariantFeaturesContextDto(makes, models, generations, variants, features));
    }
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
