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
public class VariantsController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("options")]
    public ActionResult<VariantOptionsDto> GetOptions()
    {
        // Static canonical lists; adjust as needed
        var transmissions = new List<string> { "Manual", "Automatic", "CVT", "Dual-Clutch" };
        var fuelTypes = new List<string> { "Petrol", "Diesel", "Hybrid", "Electric" };
        return Ok(new VariantOptionsDto(transmissions, fuelTypes));
    }
    [HttpGet("context")]
    public async Task<ActionResult<VariantsContextDto>> GetContext([FromQuery] int? makeId, [FromQuery] int? modelId, [FromQuery] int? generationId)
    {
        var makes = await context.Makes
            .OrderBy(x => x.Name)
            .ProjectTo<MakeDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var modelsQuery = context.Models.AsQueryable();
        if (makeId.HasValue) modelsQuery = modelsQuery.Where(m => m.MakeId == makeId.Value);
        var models = await modelsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<ModelDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var generationsQuery = context.Generations.AsQueryable();
        if (modelId.HasValue) generationsQuery = generationsQuery.Where(g => g.ModelId == modelId.Value);
        var generations = await generationsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<GenerationDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var variantsQuery = context.Variants.AsQueryable();
        if (generationId.HasValue) variantsQuery = variantsQuery.Where(v => v.GenerationId == generationId.Value);
        var variants = await variantsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<VariantDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        var payload = new VariantsContextDto(makes, models, generations, variants);
        return Ok(payload);
    }
    [HttpGet]
    public async Task<ActionResult<List<VariantDto>>> GetAll([FromQuery] int? generationId)
    {
        var query = context.Variants.AsQueryable();
        if (generationId.HasValue) query = query.Where(x => x.GenerationId == generationId);
        return await query
            .OrderBy(x => x.Name)
            .ProjectTo<VariantDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<VariantDto>> Get(int id)
    {
        var entity = await context.Variants.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<VariantDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<VariantDto>> Create(CreateVariantDto dto)
    {
        if (!await context.Generations.AnyAsync(x => x.Id == dto.GenerationId))
            return BadRequest("Invalid GenerationId");
        var entity = mapper.Map<Variant>(dto);
        context.Variants.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create variant");
        var result = mapper.Map<VariantDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateVariantDto dto)
    {
        var entity = await context.Variants.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name;
        if (dto.GenerationId.HasValue)
        {
            var exists = await context.Generations.AnyAsync(x => x.Id == dto.GenerationId.Value);
            if (!exists) return BadRequest("Invalid GenerationId");
            entity.GenerationId = dto.GenerationId.Value;
        }
        if (dto.Engine is not null) entity.Engine = dto.Engine;
        if (dto.Transmission is not null) entity.Transmission = dto.Transmission;
        if (dto.FuelType is not null) entity.FuelType = dto.FuelType;
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update variant");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Variants.FindAsync(id);
        if (entity is null) return NotFound();
        context.Variants.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete variant");
    }
}
