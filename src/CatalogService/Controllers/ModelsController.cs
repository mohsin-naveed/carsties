using AutoMapper;
using AutoMapper.QueryableExtensions;
using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Entities;
using CatalogService.RequestHelpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModelsController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<ModelDto>>> GetPaged([FromQuery] int? makeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? sort = null, [FromQuery] string? dir = null)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 200) pageSize = 10;

        var baseQuery = context.Models.AsQueryable();
        if (makeId.HasValue) baseQuery = baseQuery.Where(x => x.MakeId == makeId);

        var total = await baseQuery.CountAsync();

        var direction = (dir?.ToLowerInvariant() == "desc") ? "desc" : "asc";

        // join makes for sorting by make name
        var query = from m in baseQuery
                    join mk in context.Makes on m.MakeId equals mk.Id
                    select new { Model = m, MakeName = mk.Name };

        // default sort: Make then Model name
        var ordered = (direction == "desc")
            ? query.OrderByDescending(x => x.MakeName).ThenByDescending(x => x.Model.Name)
            : query.OrderBy(x => x.MakeName).ThenBy(x => x.Model.Name);

        if (!string.IsNullOrWhiteSpace(sort))
        {
            switch (sort.ToLowerInvariant())
            {
                case "make":
                    ordered = (direction == "desc") ? query.OrderByDescending(x => x.MakeName) : query.OrderBy(x => x.MakeName);
                    break;
                case "model":
                case "name":
                    ordered = (direction == "desc") ? query.OrderByDescending(x => x.Model.Name) : query.OrderBy(x => x.Model.Name);
                    break;
            }
        }

        var pageItems = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.Model)
            .ProjectTo<ModelDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        var result = new PagedResult<ModelDto>(pageItems, total, page, pageSize);
        return Ok(result);
    }
    [HttpGet("context")]
    public async Task<ActionResult<ModelsContextDto>> GetContext([FromQuery] int? makeId)
    {
        var makes = await context.Makes
            .OrderBy(x => x.Name)
            .ProjectTo<MakeDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var modelsQuery = context.Models.AsQueryable();
        if (makeId.HasValue) modelsQuery = modelsQuery.Where(x => x.MakeId == makeId);
        var models = await modelsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<ModelDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        return Ok(new ModelsContextDto(makes, models));
    }
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
        // Slug derived from Name; ensure uniqueness per table
        var baseSlug = SlugGenerator.FromName(dto.Name);
        var slug = baseSlug;
        int suffix = 2;
        while (await context.Models.AnyAsync(x => x.Slug == slug)) { slug = $"{baseSlug}-{suffix++}"; }
        var code = await CodeGenerator.NextModelCodeAsync(context);
        var entity = new Model { Name = dto.Name, MakeId = dto.MakeId, IsActive = dto.IsActive ?? true, IsPopular = dto.IsPopular ?? false, Code = code, Slug = slug };
        if (!await CodeGenerator.IsCodeUniqueAsync(context, "Models", entity.Code))
            return Conflict($"Code '{entity.Code}' already exists");
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
        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            entity.Name = dto.Name;
            // Recompute slug from updated name; ensure uniqueness
            var baseSlug = SlugGenerator.FromName(dto.Name);
            var slug = baseSlug;
            int suffix = 2;
            while (await context.Models.AnyAsync(x => x.Slug == slug && x.Id != id)) { slug = $"{baseSlug}-{suffix++}"; }
            entity.Slug = slug;
            // Code remains sequential; do not change on name update
        }
        if (dto.MakeId.HasValue)
        {
            var exists = await context.Makes.AnyAsync(x => x.Id == dto.MakeId.Value);
            if (!exists) return BadRequest("Invalid MakeId");
            entity.MakeId = dto.MakeId.Value;
        }
        if (dto.IsActive.HasValue) entity.IsActive = dto.IsActive.Value;
        if (dto.IsPopular.HasValue) entity.IsPopular = dto.IsPopular.Value;
        // Ignore incoming slug updates; slug is derived from name
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
