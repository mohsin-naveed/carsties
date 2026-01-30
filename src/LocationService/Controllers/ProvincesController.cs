using AutoMapper;
using AutoMapper.QueryableExtensions;
using LocationService.Data;
using LocationService.DTOs;
using LocationService.Entities;
using LocationService.RequestHelpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocationService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProvincesController(LocationDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<ProvinceDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 200) pageSize = 20;
        var q = context.Provinces.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            q = q.Where(x => x.Name.ToLower().Contains(s) || x.Code.ToLower().Contains(s));
        }
        var total = await q.CountAsync();
        var items = await q
            .OrderBy(x => x.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<ProvinceDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        return Ok(new PagedResult<ProvinceDto>(items, total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProvinceDto>> Get(int id)
    {
        var entity = await context.Provinces.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<ProvinceDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<ProvinceDto>> Create(CreateProvinceDto dto)
    {
        if (await context.Provinces.AnyAsync(x => x.Name == dto.Name))
            return Conflict($"Province '{dto.Name}' already exists");
        var code = await CodeGenerator.NextProvinceCodeAsync(context);
        var entity = new Province
        {
            Name = dto.Name,
            Code = code,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Provinces.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create province");
        var result = mapper.Map<ProvinceDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateProvinceDto dto)
    {
        var entity = await context.Provinces.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name;
        entity.UpdatedAt = DateTime.UtcNow;
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update province");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Provinces.FindAsync(id);
        if (entity is null) return NotFound();
        context.Provinces.Remove(entity);
        try
        {
            var ok = await context.SaveChangesAsync() > 0;
            return ok ? Ok() : BadRequest("Failed to delete province");
        }
        catch (DbUpdateException)
        {
            return Conflict("Cannot delete province with existing cities");
        }
    }
}
