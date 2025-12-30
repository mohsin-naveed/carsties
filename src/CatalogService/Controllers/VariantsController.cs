using AutoMapper;
using AutoMapper.QueryableExtensions;
using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VariantsController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("options")]
    public ActionResult<VariantOptionsDto> GetOptions()
    {
        var transmissions = context.Transmissions
            .OrderBy(x => x.Name)
            .Select(x => new OptionDto(x.Id, x.Name))
            .ToList();
        var fuelTypes = context.FuelTypes
            .OrderBy(x => x.Name)
            .Select(x => new OptionDto(x.Id, x.Name))
            .ToList();
        return Ok(new VariantOptionsDto(transmissions, fuelTypes));
    }

    // Dev-only reseed endpoint to align data with new reference tables
    [HttpPost("reseed")]
    public ActionResult Reseed([FromServices] IHostEnvironment env)
    {
        if (!env.IsDevelopment()) return Forbid();
        DbInitializer.ClearCatalogData(context);
        DbInitializer.SeedIfEmpty(context);
        return Ok(new { status = "reseeded" });
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
        if (modelId.HasValue)
        {
            var modelBodyIds = await context.ModelBodies.Where(b => b.ModelId == modelId.Value).Select(b => b.Id).ToListAsync();
            generationsQuery = generationsQuery.Where(g => modelBodyIds.Contains(g.ModelBodyId));
        }
        var generations = await generationsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<GenerationDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var variantsQuery = context.Variants.AsQueryable();
        if (generationId.HasValue) variantsQuery = variantsQuery.Where(v => v.GenerationId == generationId.Value);
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

        // Include model bodies to enable client-side mapping from generation -> model
        var modelBodiesQuery = context.ModelBodies.AsQueryable();
        if (modelId.HasValue) modelBodiesQuery = modelBodiesQuery.Where(mb => mb.ModelId == modelId.Value);
        var modelBodies = await modelBodiesQuery
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<ModelBodyDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        var payload = new VariantsContextDto(makes, models, modelBodies, generations, variants);
        return Ok(payload);
    }
    [HttpGet]
    public async Task<ActionResult<List<VariantDto>>> GetAll([FromQuery] int? generationId)
    {
        var query = context.Variants.AsQueryable();
        if (generationId.HasValue) query = query.Where(x => x.GenerationId == generationId);
        return await query
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
        if (dto.TransmissionId.HasValue && !await context.Transmissions.AnyAsync(x => x.Id == dto.TransmissionId.Value))
            return BadRequest("Invalid TransmissionId");
        if (dto.FuelTypeId.HasValue && !await context.FuelTypes.AnyAsync(x => x.Id == dto.FuelTypeId.Value))
            return BadRequest("Invalid FuelTypeId");
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
        if (dto.TransmissionId.HasValue)
        {
            var exists = await context.Transmissions.AnyAsync(x => x.Id == dto.TransmissionId.Value);
            if (!exists) return BadRequest("Invalid TransmissionId");
            entity.TransmissionId = dto.TransmissionId.Value;
        }
        if (dto.FuelTypeId.HasValue)
        {
            var exists = await context.FuelTypes.AnyAsync(x => x.Id == dto.FuelTypeId.Value);
            if (!exists) return BadRequest("Invalid FuelTypeId");
            entity.FuelTypeId = dto.FuelTypeId.Value;
        }
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
