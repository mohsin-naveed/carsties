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
public class GenerationsController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("context")]
    public async Task<ActionResult<GenerationsContextDto>> GetContext([FromQuery] int? makeId, [FromQuery] int? modelId)
    {
        var makesQuery = context.Makes.AsQueryable();
        var modelsQuery = context.Models.AsQueryable();
        var generationsQuery = context.Generations.AsQueryable();

        if (makeId.HasValue)
        {
            modelsQuery = modelsQuery.Where(m => m.MakeId == makeId);
            var modelIds = await modelsQuery.Select(m => m.Id).ToListAsync();
            generationsQuery = generationsQuery.Where(g => modelIds.Contains(g.ModelId));
        }
        if (modelId.HasValue)
        {
            modelsQuery = modelsQuery.Where(m => m.Id == modelId);
            generationsQuery = generationsQuery.Where(g => g.ModelId == modelId);
        }

        var makes = await makesQuery
            .OrderBy(x => x.Name)
            .ProjectTo<MakeDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var models = await modelsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<ModelDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var generations = await generationsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<GenerationDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        return Ok(new GenerationsContextDto(makes, models, generations));
    }
    [HttpGet]
    public async Task<ActionResult<List<GenerationDto>>> GetAll([FromQuery] int? modelId)
    {
        var query = context.Generations.AsQueryable();
        if (modelId.HasValue) query = query.Where(x => x.ModelId == modelId);
        return await query
            .OrderBy(x => x.Name)
            .ProjectTo<GenerationDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GenerationDto>> Get(int id)
    {
        var entity = await context.Generations.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<GenerationDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<GenerationDto>> Create(CreateGenerationDto dto)
    {
        if (!await context.Models.AnyAsync(x => x.Id == dto.ModelId))
            return BadRequest("Invalid ModelId");
        if (dto.StartYear.HasValue && dto.EndYear.HasValue && dto.StartYear > dto.EndYear)
            return BadRequest("StartYear cannot be greater than EndYear");

        var entity = mapper.Map<Generation>(dto);
        context.Generations.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create generation");
        var result = mapper.Map<GenerationDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateGenerationDto dto)
    {
        var entity = await context.Generations.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name;
        if (dto.ModelId.HasValue)
        {
            var exists = await context.Models.AnyAsync(x => x.Id == dto.ModelId.Value);
            if (!exists) return BadRequest("Invalid ModelId");
            entity.ModelId = dto.ModelId.Value;
        }
        if (dto.StartYear.HasValue) entity.StartYear = dto.StartYear;
        if (dto.EndYear.HasValue) entity.EndYear = dto.EndYear;
        if (entity.StartYear.HasValue && entity.EndYear.HasValue && entity.StartYear > entity.EndYear)
            return BadRequest("StartYear cannot be greater than EndYear");

        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update generation");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Generations.FindAsync(id);
        if (entity is null) return NotFound();
        context.Generations.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete generation");
    }
}
