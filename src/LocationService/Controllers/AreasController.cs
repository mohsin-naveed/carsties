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
public class AreasController(LocationDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<AreaDto>>> GetAll([FromQuery] int? cityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 200) pageSize = 20;
        var baseQuery = context.Areas.AsQueryable();
        if (cityId.HasValue) baseQuery = baseQuery.Where(x => x.CityId == cityId.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            baseQuery = baseQuery.Where(x => x.Name.ToLower().Contains(s) || x.Code.ToLower().Contains(s) || x.Slug.ToLower().Contains(s));
        }
        var total = await baseQuery.CountAsync();
        var ordered = baseQuery.OrderBy(x => x.Name);
        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<AreaDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        return Ok(new PagedResult<AreaDto>(items, total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AreaDto>> Get(int id)
    {
        var entity = await context.Areas.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<AreaDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<AreaDto>> Create(CreateAreaDto dto)
    {
        if (!await context.Cities.AnyAsync(x => x.Id == dto.CityId))
            return BadRequest("Invalid CityId");
        if (await context.Areas.AnyAsync(x => x.Name == dto.Name && x.CityId == dto.CityId))
            return Conflict($"Area '{dto.Name}' already exists in city");
        var code = await CodeGenerator.NextAreaCodeAsync(context);
        var baseSlug = SlugGenerator.FromName(dto.Name);
        var slug = baseSlug;
        int suffix = 2;
        while (await context.Areas.AnyAsync(x => x.Slug == slug)) { slug = $"{baseSlug}-{suffix++}"; }
        var entity = new Area
        {
            Name = dto.Name,
            CityId = dto.CityId,
            Code = code,
            Slug = slug,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Areas.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create area");
        var result = mapper.Map<AreaDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateAreaDto dto)
    {
        var entity = await context.Areas.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            entity.Name = dto.Name;
            var baseSlug = SlugGenerator.FromName(dto.Name);
            var slug = baseSlug;
            int suffix = 2;
            while (await context.Areas.AnyAsync(x => x.Slug == slug && x.Id != id)) { slug = $"{baseSlug}-{suffix++}"; }
            entity.Slug = slug;
        }
        if (dto.CityId.HasValue)
        {
            var exists = await context.Cities.AnyAsync(x => x.Id == dto.CityId.Value);
            if (!exists) return BadRequest("Invalid CityId");
            entity.CityId = dto.CityId.Value;
        }
        if (dto.Latitude.HasValue) entity.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue) entity.Longitude = dto.Longitude.Value;
        entity.UpdatedAt = DateTime.UtcNow;
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update area");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Areas.FindAsync(id);
        if (entity is null) return NotFound();
        context.Areas.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete area");
    }

    public class BulkCreatePayload { public required string Names { get; set; } public required int CityId { get; set; } }

    [HttpPost("bulk")]
    public async Task<ActionResult<BulkResult>> BulkCreate([FromBody] BulkCreatePayload payload)
    {
        if (!await context.Cities.AnyAsync(x => x.Id == payload.CityId))
            return BadRequest("Invalid CityId");
        var names = (payload.Names ?? string.Empty)
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var results = new List<BulkResultItem>();
        foreach (var name in names)
        {
            if (await context.Areas.AnyAsync(x => x.Name == name && x.CityId == payload.CityId))
            {
                results.Add(new BulkResultItem(name, false, "Duplicate name in city", null, null, null));
                continue;
            }
            var code = await CodeGenerator.NextAreaCodeAsync(context);
            var baseSlug = SlugGenerator.FromName(name);
            var slug = baseSlug;
            int suffix = 2;
            while (await context.Areas.AnyAsync(x => x.Slug == slug)) { slug = $"{baseSlug}-{suffix++}"; }
            var entity = new Area
            {
                Name = name,
                CityId = payload.CityId,
                Code = code,
                Slug = slug,
                Latitude = null,
                Longitude = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Areas.Add(entity);
            try
            {
                await context.SaveChangesAsync();
                results.Add(new BulkResultItem(name, true, null, entity.Code, entity.Slug, entity.Id));
            }
            catch (DbUpdateException ex)
            {
                results.Add(new BulkResultItem(name, false, ex.GetBaseException().Message, null, null, null));
                context.Entry(entity).State = EntityState.Detached;
            }
        }
        var succeeded = results.Count(r => r.Success);
        var failed = results.Count - succeeded;
        return Ok(new BulkResult(results, succeeded, failed));
    }
}
