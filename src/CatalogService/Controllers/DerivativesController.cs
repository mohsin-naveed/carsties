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
public class DerivativesController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("options")]
    public ActionResult<List<OptionDto>> GetOptions()
    {
        var bodyTypes = context.BodyTypes
            .OrderBy(x => x.Name)
            .Select(x => new OptionDto(x.Id, x.Name))
            .ToList();
        return Ok(bodyTypes);
    }

    [HttpGet("context")]
    public async Task<ActionResult<DerivativesContextDto>> GetContext([FromQuery] int? makeId, [FromQuery] int? modelId)
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

        var dQuery = context.Derivatives.AsQueryable();
        if (modelId.HasValue) dQuery = dQuery.Where(d => d.ModelId == modelId.Value);
        var derivatives = await dQuery
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<DerivativeDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        return Ok(new DerivativesContextDto(makes, models, derivatives));
    }

    [HttpGet]
    public async Task<ActionResult<List<DerivativeDto>>> GetAll([FromQuery] int? modelId)
    {
        var query = context.Derivatives.AsQueryable();
        if (modelId.HasValue) query = query.Where(x => x.ModelId == modelId);
        return await query
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<DerivativeDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DerivativeDto>> Get(int id)
    {
        var entity = await context.Derivatives.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<DerivativeDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<DerivativeDto>> Create(CreateDerivativeDto dto)
    {
        if (!await context.Models.AnyAsync(x => x.Id == dto.ModelId))
            return BadRequest("Invalid ModelId");
        var generation = await context.Generations.FirstOrDefaultAsync(x => x.Id == dto.GenerationId);
        if (generation is null)
            return BadRequest("Invalid GenerationId");
        if (generation.ModelId != dto.ModelId)
            return BadRequest("Generation must belong to the specified Model");
        if (!await context.BodyTypes.AnyAsync(x => x.Id == dto.BodyTypeId))
            return BadRequest("Invalid BodyTypeId");
        if (dto.Seats < 2 || dto.Seats > 9) return BadRequest("Seats must be between 2 and 9");
        if (dto.Doors < 2 || dto.Doors > 5) return BadRequest("Doors must be between 2 and 5");

        var entity = mapper.Map<Derivative>(dto);
        context.Derivatives.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create derivative");
        var result = mapper.Map<DerivativeDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateDerivativeDto dto)
    {
        var entity = await context.Derivatives.FindAsync(id);
        if (entity is null) return NotFound();
        if (dto.ModelId.HasValue)
        {
            var exists = await context.Models.AnyAsync(x => x.Id == dto.ModelId.Value);
            if (!exists) return BadRequest("Invalid ModelId");
            entity.ModelId = dto.ModelId.Value;
        }
        if (dto.GenerationId.HasValue)
        {
            var generation = await context.Generations.FirstOrDefaultAsync(x => x.Id == dto.GenerationId.Value);
            if (generation is null) return BadRequest("Invalid GenerationId");
            if (generation.ModelId != (dto.ModelId ?? entity.ModelId))
                return BadRequest("Generation must belong to the specified Model");
            entity.GenerationId = dto.GenerationId.Value;
        }
        if (dto.BodyTypeId.HasValue)
        {
            var exists = await context.BodyTypes.AnyAsync(x => x.Id == dto.BodyTypeId.Value);
            if (!exists) return BadRequest("Invalid BodyTypeId");
            entity.BodyTypeId = dto.BodyTypeId.Value;
        }
        if (dto.Seats.HasValue)
        {
            if (dto.Seats.Value < 2 || dto.Seats.Value > 9) return BadRequest("Seats must be between 2 and 9");
            entity.Seats = dto.Seats.Value;
        }
        if (dto.Doors.HasValue)
        {
            if (dto.Doors.Value < 2 || dto.Doors.Value > 5) return BadRequest("Doors must be between 2 and 5");
            entity.Doors = dto.Doors.Value;
        }
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update derivative");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Derivatives.FindAsync(id);
        if (entity is null) return NotFound();
        context.Derivatives.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete derivative");
    }
}
