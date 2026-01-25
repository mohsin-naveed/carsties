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
public class FeaturesController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    private async Task<string> GenerateUniqueCodeAsync()
    {
        // New requirement: FR-001, FR-002 ... style codes
        return await CodeGenerator.NextFeatureCodeAsync(context);
    }

    // Lookup a single feature by Code (FR-###)
    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<FeatureDetailDto>> GetByCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return BadRequest("Code is required");
        code = code.ToUpperInvariant();
        var feature = await context.Features
            .Include(f => f.Category)
            .FirstOrDefaultAsync(f => f.Code == code);
        if (feature is null) return NotFound();
        var dto = new FeatureDetailDto(
            feature.Code,
            feature.Name,
            feature.Description,
            feature.Category?.Name,
            feature.Category?.Code
        );
        return Ok(dto);
    }

    // Batch lookup features by Code
    [HttpGet("by-codes")]
    public async Task<ActionResult<List<FeatureDetailDto>>> GetByCodes([FromQuery(Name = "codes")] string[] codes)
    {
        if (codes == null || codes.Length == 0) return Ok(new List<FeatureDetailDto>());
        var normalized = codes.Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.ToUpperInvariant())
            .Distinct()
            .ToArray();
        var features = await context.Features
            .Include(f => f.Category)
            .Where(f => normalized.Contains(f.Code))
            .OrderBy(f => f.Name)
            .ToListAsync();
        var result = features.Select(f => new FeatureDetailDto(
            f.Code,
            f.Name,
            f.Description,
            f.Category?.Name,
            f.Category?.Code
        )).ToList();
        return Ok(result);
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<FeatureDto>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? sort = null, [FromQuery] string? dir = null)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 200) pageSize = 10;

        var baseQuery = context.Features.AsQueryable();
        var total = await baseQuery.CountAsync();
        var direction = (dir?.ToLowerInvariant() == "desc") ? "desc" : "asc";

        IOrderedQueryable<Feature> ordered = (direction == "desc")
            ? baseQuery.OrderByDescending(x => x.Name)
            : baseQuery.OrderBy(x => x.Name);

        if (!string.IsNullOrWhiteSpace(sort))
        {
            switch (sort.ToLowerInvariant())
            {
                case "name":
                    ordered = (direction == "desc") ? baseQuery.OrderByDescending(x => x.Name) : baseQuery.OrderBy(x => x.Name);
                    break;
                case "description":
                    ordered = (direction == "desc") ? baseQuery.OrderByDescending(x => x.Description) : baseQuery.OrderBy(x => x.Description);
                    break;
                case "category":
                    ordered = (direction == "desc") ? baseQuery.OrderByDescending(x => x.FeatureCategoryId) : baseQuery.OrderBy(x => x.FeatureCategoryId);
                    break;
            }
        }

        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<FeatureDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        var result = new PagedResult<FeatureDto>(items, total, page, pageSize);
        return Ok(result);
    }
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
        var catOk = await context.FeatureCategories.AnyAsync(c => c.Id == dto.FeatureCategoryId);
        if (!catOk) return BadRequest("Invalid FeatureCategoryId");
        var entity = mapper.Map<Feature>(dto);
        // Slug derived from Name; ensure uniqueness per table
        var baseSlug = SlugGenerator.FromName(dto.Name);
        var slug = baseSlug;
        int suffix = 2;
        while (await context.Features.AnyAsync(x => x.Slug == slug)) { slug = $"{baseSlug}-{suffix++}"; }
        entity.Slug = slug;
        entity.Code = await GenerateUniqueCodeAsync();
        context.Features.Add(entity);
        try
        {
            var ok = await context.SaveChangesAsync() > 0;
            if (!ok) return BadRequest("Failed to create feature");
        }
        catch (DbUpdateException)
        {
            return Conflict($"Feature code already exists for name '{dto.Name}'");
        }
        var result = mapper.Map<FeatureDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateFeatureDto dto)
    {
        var entity = await context.Features.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            // Keep code stable; only update name
            entity.Name = dto.Name;
            // Recompute slug from updated name; ensure uniqueness
            var baseSlug = SlugGenerator.FromName(dto.Name);
            var slug = baseSlug;
            int suffix = 2;
            while (await context.Features.AnyAsync(x => x.Slug == slug && x.Id != id)) { slug = $"{baseSlug}-{suffix++}"; }
            entity.Slug = slug;
        }
        if (dto.FeatureCategoryId.HasValue)
        {
            var catOk = await context.FeatureCategories.AnyAsync(c => c.Id == dto.FeatureCategoryId.Value);
            if (!catOk) return BadRequest("Invalid FeatureCategoryId");
            entity.FeatureCategoryId = dto.FeatureCategoryId.Value;
        }
        if (dto.Description is not null) entity.Description = dto.Description;
        // Ignore incoming slug updates; slug is derived from name
        try
        {
            var ok = await context.SaveChangesAsync() > 0;
            return ok ? Ok() : BadRequest("Failed to update feature");
        }
        catch (DbUpdateException)
        {
            return Conflict("Feature code already exists");
        }
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
