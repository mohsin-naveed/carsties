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
public class ModelBodiesController(CatalogDbContext context, IMapper mapper) : ControllerBase
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
    public async Task<ActionResult<ModelBodiesContextDto>> GetContext([FromQuery] int? makeId, [FromQuery] int? modelId)
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

        var mbQuery = context.ModelBodies.AsQueryable();
        if (modelId.HasValue) mbQuery = mbQuery.Where(b => b.ModelId == modelId.Value);
        var modelBodies = await mbQuery
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<ModelBodyDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        return Ok(new ModelBodiesContextDto(makes, models, modelBodies));
    }

    [HttpGet]
    public async Task<ActionResult<List<ModelBodyDto>>> GetAll([FromQuery] int? modelId)
    {
        var query = context.ModelBodies.AsQueryable();
        if (modelId.HasValue) query = query.Where(x => x.ModelId == modelId);
        return await query
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<ModelBodyDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ModelBodyDto>> Get(int id)
    {
        var entity = await context.ModelBodies.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<ModelBodyDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<ModelBodyDto>> Create(CreateModelBodyDto dto)
    {
        if (!await context.Models.AnyAsync(x => x.Id == dto.ModelId))
            return BadRequest("Invalid ModelId");
        if (!await context.BodyTypes.AnyAsync(x => x.Id == dto.BodyTypeId))
            return BadRequest("Invalid BodyTypeId");
        if (dto.Seats < 2 || dto.Seats > 9) return BadRequest("Seats must be between 2 and 9");
        if (dto.Doors < 2 || dto.Doors > 5) return BadRequest("Doors must be between 2 and 5");

        var entity = mapper.Map<ModelBody>(dto);
        context.ModelBodies.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create model body");
        var result = mapper.Map<ModelBodyDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateModelBodyDto dto)
    {
        var entity = await context.ModelBodies.FindAsync(id);
        if (entity is null) return NotFound();
        if (dto.ModelId.HasValue)
        {
            var exists = await context.Models.AnyAsync(x => x.Id == dto.ModelId.Value);
            if (!exists) return BadRequest("Invalid ModelId");
            entity.ModelId = dto.ModelId.Value;
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
        return ok ? Ok() : BadRequest("Failed to update model body");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.ModelBodies.FindAsync(id);
        if (entity is null) return NotFound();
        context.ModelBodies.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete model body");
    }
}
