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
public class GenerationsController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<GenerationDto>>> GetPaged([FromQuery] int? makeId, [FromQuery] int? modelId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? sort = null, [FromQuery] string? dir = null)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0 || pageSize > 200) pageSize = 10;

        var baseQuery = context.Generations.AsQueryable();
        if (modelId.HasValue) baseQuery = baseQuery.Where(g => g.ModelId == modelId.Value);
        if (makeId.HasValue)
        {
            var modelIdsForMake = await context.Models
                .Where(m => m.MakeId == makeId.Value)
                .Select(m => m.Id)
                .ToListAsync();
            baseQuery = baseQuery.Where(g => modelIdsForMake.Contains(g.ModelId));
        }

        var total = await baseQuery.CountAsync();
        var direction = (dir?.ToLowerInvariant() == "desc") ? "desc" : "asc";

        var query = from g in baseQuery
                    join m in context.Models on g.ModelId equals m.Id
                    join mk in context.Makes on m.MakeId equals mk.Id
                    select new { Gen = g, ModelName = m.Name, MakeName = mk.Name };

        var ordered = (direction == "desc")
            ? query.OrderByDescending(x => x.MakeName).ThenByDescending(x => x.ModelName).ThenByDescending(x => x.Gen.Name)
            : query.OrderBy(x => x.MakeName).ThenBy(x => x.ModelName).ThenBy(x => x.Gen.Name);

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
                    ordered = (direction == "desc") ? query.OrderByDescending(x => x.Gen.Name) : query.OrderBy(x => x.Gen.Name);
                    break;
                case "years":
                    ordered = (direction == "desc") ? query.OrderByDescending(x => x.Gen.StartYear).ThenByDescending(x => x.Gen.EndYear) : query.OrderBy(x => x.Gen.StartYear).ThenBy(x => x.Gen.EndYear);
                    break;
            }
        }

        var pageItems = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.Gen)
            .ProjectTo<GenerationDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        var result = new PagedResult<GenerationDto>(pageItems, total, page, pageSize);
        return Ok(result);
    }
    [HttpGet("context")]
    public async Task<ActionResult<GenerationsContextDto>> GetContext([FromQuery] int? makeId, [FromQuery] int? modelId)
    {
        var makesQuery = context.Makes.AsQueryable();
        var modelsQuery = context.Models.AsQueryable();
        var generationsQuery = context.Generations.AsQueryable();

        if (makeId.HasValue)
        {
            modelsQuery = modelsQuery.Where(m => m.MakeId == makeId);
            var modelIds = await modelsQuery.Select(m => m.Id).ToListAsync();
            generationsQuery = generationsQuery.Where(g => modelIds.Contains(g.ModelId));
        }
        if (modelId.HasValue)
        {
            modelsQuery = modelsQuery.Where(m => m.Id == modelId);
            generationsQuery = generationsQuery.Where(g => g.ModelId == modelId);
        }

        var makes = await makesQuery
            .OrderBy(x => x.Name)
            .ProjectTo<MakeDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var models = await modelsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<ModelDto>(mapper.ConfigurationProvider)
            .ToListAsync();
        var generations = await generationsQuery
            .OrderBy(x => x.Name)
            .ProjectTo<GenerationDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        var derivativesQuery = context.Derivatives.AsQueryable();
        if (modelId.HasValue) derivativesQuery = derivativesQuery.Where(d => d.ModelId == modelId.Value);
        if (makeId.HasValue)
        {
            var modelIdsForMake = await context.Models.Where(m => m.MakeId == makeId.Value).Select(m => m.Id).ToListAsync();
            derivativesQuery = derivativesQuery.Where(d => modelIdsForMake.Contains(d.ModelId));
        }
        var derivatives = await derivativesQuery
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<DerivativeDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        return Ok(new GenerationsContextDto(makes, models, derivatives, generations));
    }
    [HttpGet]
    public async Task<ActionResult<List<GenerationDto>>> GetAll([FromQuery] int? modelId)
    {
        var query = context.Generations.AsQueryable();
        if (modelId.HasValue) query = query.Where(x => x.ModelId == modelId);
        return await query
            .OrderBy(x => x.Name)
            .ProjectTo<GenerationDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GenerationDto>> Get(int id)
    {
        var entity = await context.Generations.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<GenerationDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<GenerationDto>> Create(CreateGenerationDto dto)
    {
        if (!await context.Models.AnyAsync(x => x.Id == dto.ModelId))
            return BadRequest("Invalid ModelId");
        if (dto.StartYear.HasValue && dto.EndYear.HasValue && dto.StartYear > dto.EndYear)
            return BadRequest("StartYear cannot be greater than EndYear");
        var entity = mapper.Map<Generation>(dto);
        // assign code if not provided
        if (string.IsNullOrWhiteSpace(entity.Code))
        {
            entity.Code = await RequestHelpers.CodeGenerator.NextGenerationCodeAsync(context);
        }
        // ensure uniqueness
        if (await context.Generations.AnyAsync(g => g.Code == entity.Code))
            return Conflict($"Code '{entity.Code}' already exists");
        context.Generations.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create generation");
        var result = mapper.Map<GenerationDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateGenerationDto dto)
    {
        var entity = await context.Generations.FindAsync(id);
        if (entity is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name;
        if (dto.ModelId.HasValue)
        {
            var exists = await context.Models.AnyAsync(x => x.Id == dto.ModelId.Value);
            if (!exists) return BadRequest("Invalid ModelId");
            entity.ModelId = dto.ModelId.Value;
        }
        if (dto.StartYear.HasValue) entity.StartYear = dto.StartYear;
        if (dto.EndYear.HasValue) entity.EndYear = dto.EndYear;
        if (!string.IsNullOrWhiteSpace(dto.Code))
        {
            if (await context.Generations.AnyAsync(g => g.Code == dto.Code && g.Id != id))
                return Conflict($"Code '{dto.Code}' already exists");
            entity.Code = dto.Code!;
        }
        if (entity.StartYear.HasValue && entity.EndYear.HasValue && entity.StartYear > entity.EndYear)
            return BadRequest("StartYear cannot be greater than EndYear");

        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update generation");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Generations.FindAsync(id);
        if (entity is null) return NotFound();
        context.Generations.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete generation");
    }
}
