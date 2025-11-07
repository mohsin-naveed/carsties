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
public class ModelsController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ModelDto>>> GetAll([FromQuery] int? makeId)
    {
        var query = context.Models.AsQueryable();
        if (makeId.HasValue) query = query.Where(x => x.MakeId == makeId);
        return await query
            .OrderBy(x => x.Name)
            .ProjectTo<ModelDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ModelDto>> Get(int id)
    {
        var entity = await context.Models.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<ModelDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<ModelDto>> Create(CreateModelDto dto)
    {
        if (!await context.Makes.AnyAsync(x => x.Id == dto.MakeId))
            return BadRequest("Invalid MakeId");
        var entity = mapper.Map<Model>(dto);
        context.Models.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create model");
        var result = mapper.Map<ModelDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateModelDto dto)
    {
        var entity = await context.Models.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name;
        if (dto.MakeId.HasValue)
        {
            var exists = await context.Makes.AnyAsync(x => x.Id == dto.MakeId.Value);
            if (!exists) return BadRequest("Invalid MakeId");
            entity.MakeId = dto.MakeId.Value;
        }
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update model");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Models.FindAsync(id);
        if (entity is null) return NotFound();
        context.Models.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete model");
    }
}
