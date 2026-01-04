using AutoMapper;
using AutoMapper.QueryableExtensions;
using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VariantsController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<VariantDto>>> GetPaged([FromQuery] int? makeId, [FromQuery] int? modelId, [FromQuery] int? derivativeId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? sort = null, [FromQuery] string? dir = null)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 200) pageSize = 10;

        var baseQuery = context.Variants.AsQueryable();
        if (derivativeId.HasValue) baseQuery = baseQuery.Where(v => v.DerivativeId == derivativeId.Value);
        if (modelId.HasValue)
        {
            baseQuery = from v in baseQuery
                        join d in context.Derivatives on v.DerivativeId equals d.Id
                        where d.ModelId == modelId.Value
                        select v;
        }
        if (makeId.HasValue)
        {
            baseQuery = from v in baseQuery
                        join d in context.Derivatives on v.DerivativeId equals d.Id
                        join m in context.Models on d.ModelId equals m.Id
                        where m.MakeId == makeId.Value
                        select v;
        }

        var total = await baseQuery.CountAsync();
        var direction = (dir?.ToLowerInvariant() == "desc") ? "desc" : "asc";

        var query = from v in baseQuery
                    join d in context.Derivatives on v.DerivativeId equals d.Id
                    join m in context.Models on d.ModelId equals m.Id
                    join mk in context.Makes on m.MakeId equals mk.Id
                    join g in context.Generations on d.GenerationId equals g.Id into gj
                    from g in gj.DefaultIfEmpty()
                    select new { v, Derivative = d, ModelName = m.Name, MakeName = mk.Name, GenerationName = g != null ? g.Name : string.Empty };

        var ordered = (direction == "desc")
            ? query.OrderByDescending(x => x.MakeName).ThenByDescending(x => x.ModelName).ThenByDescending(x => x.v.Name)
            : query.OrderBy(x => x.MakeName).ThenBy(x => x.ModelName).ThenBy(x => x.v.Name);

        if (!string.IsNullOrWhiteSpace(sort))
        {
            switch (sort.ToLowerInvariant())
            {
                case "make":
                    ordered = (direction == "desc") ? query.OrderByDescending(x => x.MakeName) : query.OrderBy(x => x.MakeName);
                    break;
                case "model":
                    ordered = (direction == "desc") ? query.OrderByDescending(x => x.ModelName) : query.OrderBy(x => x.ModelName);
                    break;
                case "name":
                    ordered = (direction == "desc") ? query.OrderByDescending(x => x.v.Name) : query.OrderBy(x => x.v.Name);
                    break;
                case "generation":
                    ordered = (direction == "desc") ? query.OrderByDescending(x => x.GenerationName) : query.OrderBy(x => x.GenerationName);
                    break;
            }
        }

        var pageItems = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.v)
            .Select(v => new VariantDto(v.Id, v.Name, v.DerivativeId))
            .ToListAsync();

        var result = new PagedResult<VariantDto>(pageItems, total, page, pageSize);
        return Ok(result);
    }
    [HttpGet("options")]
    public ActionResult<VariantOptionsDto> GetOptions()
    {
        var transmissions = context.Transmissions
            .OrderBy(x => x.Name)
            .Select(x => new OptionDto(x.Id, x.Name))
            .ToList();
        var fuelTypes = context.FuelTypes
            .OrderBy(x => x.Name)
            .Select(x => new OptionDto(x.Id, x.Name))
            .ToList();
        return Ok(new VariantOptionsDto(transmissions, fuelTypes));
    }

    // Dev-only reseed endpoint to align data with new reference tables
    [HttpPost("reseed")]
    public ActionResult Reseed([FromServices] IHostEnvironment env)
    {
        if (!env.IsDevelopment()) return Forbid();
        DbInitializer.ClearCatalogData(context);
        DbInitializer.SeedPakistanMarket(context);
        return Ok(new { status = "reseeded" });
    }
    [HttpGet("context")]
    public async Task<ActionResult<VariantsContextDto>> GetContext([FromQuery] int? makeId, [FromQuery] int? modelId, [FromQuery] int? generationId)
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
        var generationsQuery = context.Generations.AsQueryable();
        if (modelId.HasValue)
        {
            generationsQuery = generationsQuery.Where(g => g.ModelId == modelId.Value);
        }
        var generations = await generationsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<GenerationDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var variantsQuery = context.Variants.AsQueryable();
        if (generationId.HasValue)
        {
            variantsQuery = variantsQuery
                .Join(context.Derivatives, v => v.DerivativeId, d => d.Id, (v, d) => new { v, d })
                .Where(x => x.d.GenerationId == generationId.Value)
                .Select(x => x.v);
        }
        var variants = await variantsQuery
            .OrderBy(x => x.Name)
            .Select(v => new VariantDto(
                v.Id,
                v.Name,
                v.DerivativeId))
            .ToListAsync();

        // Include derivatives to enable client-side mapping from generation -> model
        var derivativesQuery = context.Derivatives.AsQueryable();
        if (modelId.HasValue) derivativesQuery = derivativesQuery.Where(d => d.ModelId == modelId.Value);
        var derivatives = await derivativesQuery
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<DerivativeDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        var payload = new VariantsContextDto(makes, models, derivatives, generations, variants);
        return Ok(payload);
    }
    [HttpGet]
    public async Task<ActionResult<List<VariantDto>>> GetAll([FromQuery] int? generationId)
    {
        var query = context.Variants.AsQueryable();
        if (generationId.HasValue)
        {
            query = query
                .Join(context.Derivatives, v => v.DerivativeId, d => d.Id, (v, d) => new { v, d })
                .Where(x => x.d.GenerationId == generationId)
                .Select(x => x.v);
        }
        return await query
            .OrderBy(x => x.Name)
            .Select(v => new VariantDto(
                v.Id,
                v.Name,
                v.DerivativeId))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<VariantDto>> Get(int id)
    {
        var entity = await context.Variants.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<VariantDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<VariantDto>> Create(CreateVariantDto dto)
    {
        if (!await context.Derivatives.AnyAsync(x => x.Id == dto.DerivativeId))
            return BadRequest("Invalid DerivativeId");
        var entity = mapper.Map<Variant>(dto);
        context.Variants.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create variant");
        var result = mapper.Map<VariantDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateVariantDto dto)
    {
        var entity = await context.Variants.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name;
        if (dto.DerivativeId.HasValue)
        {
            var exists = await context.Derivatives.AnyAsync(x => x.Id == dto.DerivativeId.Value);
            if (!exists) return BadRequest("Invalid DerivativeId");
            entity.DerivativeId = dto.DerivativeId.Value;
        }
        // Engine/Transmission/Fuel removed from Variants
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update variant");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Variants.FindAsync(id);
        if (entity is null) return NotFound();
        context.Variants.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete variant");
    }
}
