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
public class DerivativesController(CatalogDbContext context, IMapper mapper) : ControllerBase
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
    public async Task<ActionResult<DerivativesContextDto>> GetContext([FromQuery] int? makeId, [FromQuery] int? modelId)
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

        var dQuery = context.Derivatives.AsQueryable();
        if (modelId.HasValue) dQuery = dQuery.Where(d => d.ModelId == modelId.Value);
        var derivatives = await dQuery
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<DerivativeDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        return Ok(new DerivativesContextDto(makes, models, derivatives));
    }

    [HttpGet]
    public async Task<ActionResult<List<DerivativeDto>>> GetAll([FromQuery] int? modelId)
    {
        var query = context.Derivatives.AsQueryable();
        if (modelId.HasValue) query = query.Where(x => x.ModelId == modelId);
        return await query
            .OrderBy(x => x.ModelId).ThenBy(x => x.BodyTypeId)
            .ProjectTo<DerivativeDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }


    // Server-side pagination and sorting
    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<DerivativeDto>>> GetPaged(
        [FromQuery] int? makeId,
        [FromQuery] int? modelId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sort = null,
        [FromQuery] string? dir = "asc")
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 200) pageSize = 10;

        var baseQuery = from d in context.Derivatives
                        join m in context.Models on d.ModelId equals m.Id
                        join mk in context.Makes on m.MakeId equals mk.Id
                        select new { d, m, mk };

        if (makeId.HasValue)
            baseQuery = baseQuery.Where(x => x.mk.Id == makeId.Value);
        if (modelId.HasValue)
            baseQuery = baseQuery.Where(x => x.m.Id == modelId.Value);

        var total = await baseQuery.CountAsync();

        // Default multi-sort: Make, Model, Name
        bool desc = string.Equals(dir, "desc", StringComparison.OrdinalIgnoreCase);
        var ordered = baseQuery;
        if (string.IsNullOrWhiteSpace(sort))
        {
            ordered = desc
                ? baseQuery.OrderByDescending(x => x.mk.Name).ThenByDescending(x => x.m.Name).ThenByDescending(x => x.d.Name)
                : baseQuery.OrderBy(x => x.mk.Name).ThenBy(x => x.m.Name).ThenBy(x => x.d.Name);
        }
        else
        {
            switch (sort.ToLowerInvariant())
            {
                case "make":
                    ordered = desc ? baseQuery.OrderByDescending(x => x.mk.Name) : baseQuery.OrderBy(x => x.mk.Name);
                    break;
                case "model":
                    ordered = desc ? baseQuery.OrderByDescending(x => x.m.Name) : baseQuery.OrderBy(x => x.m.Name);
                    break;
                case "name":
                    ordered = desc ? baseQuery.OrderByDescending(x => x.d.Name) : baseQuery.OrderBy(x => x.d.Name);
                    break;
                case "bodytype":
                    ordered = desc ? baseQuery.OrderByDescending(x => x.d.BodyTypeId) : baseQuery.OrderBy(x => x.d.BodyTypeId);
                    break;
                case "fuel":
                    ordered = desc ? baseQuery.OrderByDescending(x => x.d.FuelTypeId) : baseQuery.OrderBy(x => x.d.FuelTypeId);
                    break;
                case "transmission":
                    ordered = desc ? baseQuery.OrderByDescending(x => x.d.TransmissionId) : baseQuery.OrderBy(x => x.d.TransmissionId);
                    break;
                case "seats":
                    ordered = desc ? baseQuery.OrderByDescending(x => x.d.Seats) : baseQuery.OrderBy(x => x.d.Seats);
                    break;
                case "doors":
                    ordered = desc ? baseQuery.OrderByDescending(x => x.d.Doors) : baseQuery.OrderBy(x => x.d.Doors);
                    break;
                default:
                    ordered = desc ? baseQuery.OrderByDescending(x => x.mk.Name).ThenByDescending(x => x.m.Name) : baseQuery.OrderBy(x => x.mk.Name).ThenBy(x => x.m.Name);
                    break;
            }
        }

        var pageItemsQuery = ordered.Skip((page - 1) * pageSize).Take(pageSize).Select(x => x.d);
        var items = await pageItemsQuery
            .ProjectTo<DerivativeDto>(mapper.ConfigurationProvider)
            .ToListAsync();

        return Ok(new PagedResult<DerivativeDto>(items, total, page, pageSize));
    }
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DerivativeDto>> Get(int id)
    {
        var entity = await context.Derivatives.FindAsync(id);
        return entity is null ? NotFound() : mapper.Map<DerivativeDto>(entity);
    }

    [HttpPost]
    public async Task<ActionResult<DerivativeDto>> Create(CreateDerivativeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length > 100)
            return BadRequest("Name is required and must be <= 100 characters");
        if (!await context.Models.AnyAsync(x => x.Id == dto.ModelId))
            return BadRequest("Invalid ModelId");
        var generation = await context.Generations.FirstOrDefaultAsync(x => x.Id == dto.GenerationId);
        if (generation is null)
            return BadRequest("Invalid GenerationId");
        if (generation.ModelId != dto.ModelId)
            return BadRequest("Generation must belong to the specified Model");
        if (dto.TransmissionId.HasValue && !await context.Transmissions.AnyAsync(x => x.Id == dto.TransmissionId.Value))
            return BadRequest("Invalid TransmissionId");
        FuelType? fuel = null;
        if (dto.FuelTypeId.HasValue)
        {
            fuel = await context.FuelTypes.FirstOrDefaultAsync(x => x.Id == dto.FuelTypeId.Value);
            if (fuel is null) return BadRequest("Invalid FuelTypeId");
        }
        if (!await context.BodyTypes.AnyAsync(x => x.Id == dto.BodyTypeId))
            return BadRequest("Invalid BodyTypeId");
        if (dto.Seats < 2 || dto.Seats > 9) return BadRequest("Seats must be between 2 and 9");
        if (dto.Doors < 2 || dto.Doors > 5) return BadRequest("Doors must be between 2 and 5");

        // Validation: if fuel is Electric, require battery; else engine stays optional
        if (fuel != null && string.Equals(fuel.Name, "Electric", StringComparison.OrdinalIgnoreCase))
        {
            if (!dto.BatteryCapacityKWh.HasValue || dto.BatteryCapacityKWh.Value <= 0)
                return BadRequest("BatteryCapacityKWh must be provided for Electric vehicles");
            // Do not mutate init-only DTO; enforce on entity after mapping
        }

        var entity = mapper.Map<Derivative>(dto);
        if (fuel != null && string.Equals(fuel.Name, "Electric", StringComparison.OrdinalIgnoreCase))
        {
            entity.Engine = null;
        }
        context.Derivatives.Add(entity);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create derivative");
        var result = mapper.Map<DerivativeDto>(entity);
        return CreatedAtAction(nameof(Get), new { id = entity.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateDerivativeDto dto)
    {
        var entity = await context.Derivatives.FindAsync(id);
        if (entity is null) return NotFound();
        if (dto.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length > 100)
                return BadRequest("Name must be <= 100 characters");
            entity.Name = dto.Name;
        }
        if (dto.ModelId.HasValue)
        {
            var exists = await context.Models.AnyAsync(x => x.Id == dto.ModelId.Value);
            if (!exists) return BadRequest("Invalid ModelId");
            entity.ModelId = dto.ModelId.Value;
        }
        if (dto.GenerationId.HasValue)
        {
            var generation = await context.Generations.FirstOrDefaultAsync(x => x.Id == dto.GenerationId.Value);
            if (generation is null) return BadRequest("Invalid GenerationId");
            if (generation.ModelId != (dto.ModelId ?? entity.ModelId))
                return BadRequest("Generation must belong to the specified Model");
            entity.GenerationId = dto.GenerationId.Value;
        }
        if (dto.BodyTypeId.HasValue)
        {
            var exists = await context.BodyTypes.AnyAsync(x => x.Id == dto.BodyTypeId.Value);
            if (!exists) return BadRequest("Invalid BodyTypeId");
            entity.BodyTypeId = dto.BodyTypeId.Value;
        }
        if (dto.Engine is not null) entity.Engine = dto.Engine;
        if (dto.TransmissionId.HasValue)
        {
            var exists = await context.Transmissions.AnyAsync(x => x.Id == dto.TransmissionId.Value);
            if (!exists) return BadRequest("Invalid TransmissionId");
            entity.TransmissionId = dto.TransmissionId.Value;
        }
        if (dto.FuelTypeId.HasValue)
        {
            var fuel = await context.FuelTypes.FirstOrDefaultAsync(x => x.Id == dto.FuelTypeId.Value);
            if (fuel is null) return BadRequest("Invalid FuelTypeId");
            entity.FuelTypeId = dto.FuelTypeId.Value;
            // Apply electric-specific rule
            if (string.Equals(fuel.Name, "Electric", StringComparison.OrdinalIgnoreCase))
            {
                if (!dto.BatteryCapacityKWh.HasValue || dto.BatteryCapacityKWh.Value <= 0)
                    return BadRequest("BatteryCapacityKWh must be provided for Electric vehicles");
                entity.BatteryCapacityKWh = dto.BatteryCapacityKWh;
                entity.Engine = null;
            }
        }
        if (dto.BatteryCapacityKWh.HasValue) entity.BatteryCapacityKWh = dto.BatteryCapacityKWh.Value;
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
        return ok ? Ok() : BadRequest("Failed to update derivative");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var entity = await context.Derivatives.FindAsync(id);
        if (entity is null) return NotFound();
        context.Derivatives.Remove(entity);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete derivative");
    }
}
