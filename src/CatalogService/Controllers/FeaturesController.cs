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
public class FeaturesController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<FeatureDto>>> GetAll()
    {
        return await context.Features
            .OrderBy(x => x.Name)
            .ProjectTo<FeatureDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<FeatureDto>> Get(int id)
    {
        var entity = await context.Features.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<FeatureDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<FeatureDto>> Create(CreateFeatureDto dto)
    {
        if (await context.Features.AnyAsync(x => x.Name == dto.Name))
            return Conflict($"Feature '{dto.Name}' already exists");
        var entity = mapper.Map<Feature>(dto);
        context.Features.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create feature");
        var result = mapper.Map<FeatureDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateFeatureDto dto)
    {
        var entity = await context.Features.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name;
        if (dto.Description is not null) entity.Description = dto.Description;
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update feature");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Features.FindAsync(id);
        if (entity is null) return NotFound();
        context.Features.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete feature");
    }
}
