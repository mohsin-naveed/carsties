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
public class CitiesController(LocationDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<CityDto>>> GetAll([FromQuery] int? provinceId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 200) pageSize = 20;
        var baseQuery = context.Cities.AsQueryable();
        if (provinceId.HasValue) baseQuery = baseQuery.Where(x => x.ProvinceId == provinceId.Value);
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
            .ProjectTo<CityDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        return Ok(new PagedResult<CityDto>(items, total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CityDto>> Get(int id)
    {
        var entity = await context.Cities.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<CityDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<CityDto>> Create(CreateCityDto dto)
    {
        if (!await context.Provinces.AnyAsync(x => x.Id == dto.ProvinceId))
            return BadRequest("Invalid ProvinceId");
        if (await context.Cities.AnyAsync(x => x.Name == dto.Name && x.ProvinceId == dto.ProvinceId))
            return Conflict($"City '{dto.Name}' already exists in province");
        var code = await CodeGenerator.NextCityCodeAsync(context);
        var baseSlug = SlugGenerator.FromName(dto.Name);
        var slug = baseSlug;
        int suffix = 2;
        while (await context.Cities.AnyAsync(x => x.Slug == slug)) { slug = $"{baseSlug}-{suffix++}"; }
        var entity = new City
        {
            Name = dto.Name,
            ProvinceId = dto.ProvinceId,
            Code = code,
            Slug = slug,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Cities.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create city");
        var result = mapper.Map<CityDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateCityDto dto)
    {
        var entity = await context.Cities.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            entity.Name = dto.Name;
            var baseSlug = SlugGenerator.FromName(dto.Name);
            var slug = baseSlug;
            int suffix = 2;
            while (await context.Cities.AnyAsync(x => x.Slug == slug && x.Id != id)) { slug = $"{baseSlug}-{suffix++}"; }
            entity.Slug = slug;
        }
        if (dto.ProvinceId.HasValue)
        {
            var exists = await context.Provinces.AnyAsync(x => x.Id == dto.ProvinceId.Value);
            if (!exists) return BadRequest("Invalid ProvinceId");
            entity.ProvinceId = dto.ProvinceId.Value;
        }
        entity.UpdatedAt = DateTime.UtcNow;
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update city");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Cities.FindAsync(id);
        if (entity is null) return NotFound();
        context.Cities.Remove(entity);
        try
        {
            var ok = await context.SaveChangesAsync() > 0;
            return ok ? Ok() : BadRequest("Failed to delete city");
        }
        catch (DbUpdateException)
        {
            return Conflict("Cannot delete city with existing areas");
        }
    }

    public class BulkCreatePayload { public required string Names { get; set; } public required int ProvinceId { get; set; } }

    [HttpPost("bulk")]
    public async Task<ActionResult<BulkResult>> BulkCreate([FromBody] BulkCreatePayload payload)
    {
        if (!await context.Provinces.AnyAsync(x => x.Id == payload.ProvinceId))
            return BadRequest("Invalid ProvinceId");
        var names = (payload.Names ?? string.Empty)
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var results = new List<BulkResultItem>();
        foreach (var name in names)
        {
            if (await context.Cities.AnyAsync(x => x.Name == name && x.ProvinceId == payload.ProvinceId))
            {
                results.Add(new BulkResultItem(name, false, "Duplicate name in province", null, null, null));
                continue;
            }
            var code = await CodeGenerator.NextCityCodeAsync(context);
            var baseSlug = SlugGenerator.FromName(name);
            var slug = baseSlug;
            int suffix = 2;
            while (await context.Cities.AnyAsync(x => x.Slug == slug)) { slug = $"{baseSlug}-{suffix++}"; }
            var entity = new City
            {
                Name = name,
                ProvinceId = payload.ProvinceId,
                Code = code,
                Slug = slug,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Cities.Add(entity);
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
