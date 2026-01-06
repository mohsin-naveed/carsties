using AutoMapper;
using AutoMapper.QueryableExtensions;
using ListingService.Data;
using ListingService.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ListingService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReferencesController(ListingDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet("makes")]
    public async Task<ActionResult<List<MakeDto>>> GetMakes() =>
        await context.Makes.OrderBy(x => x.Name).ProjectTo<MakeDto>(mapper.ConfigurationProvider).ToListAsync();

    [HttpGet("models")]
    public async Task<ActionResult<List<ModelDto>>> GetModels([FromQuery] int? makeId)
    {
        var query = context.Models.AsQueryable();
        if (makeId.HasValue) query = query.Where(m => m.MakeId == makeId);
        return await query.OrderBy(x => x.Name).ProjectTo<ModelDto>(mapper.ConfigurationProvider).ToListAsync();
    }

    [HttpGet("generations")]
    public async Task<ActionResult<List<GenerationDto>>> GetGenerations([FromQuery] int? modelId)
    {
        var query = context.Generations.AsQueryable();
        if (modelId.HasValue) query = query.Where(g => g.ModelId == modelId);
        return await query.OrderBy(x => x.Name).ProjectTo<GenerationDto>(mapper.ConfigurationProvider).ToListAsync();
    }

    [HttpGet("derivatives")]
    public async Task<ActionResult<List<DerivativeDto>>> GetDerivatives([FromQuery] int? modelId)
    {
        var query = context.Derivatives.AsQueryable();
        if (modelId.HasValue) query = query.Where(d => d.ModelId == modelId);
        return await query.OrderBy(x => x.Name).ProjectTo<DerivativeDto>(mapper.ConfigurationProvider).ToListAsync();
    }

    [HttpGet("variants")]
    public async Task<ActionResult<List<VariantDto>>> GetVariants([FromQuery] int? derivativeId)
    {
        var query = context.Variants.AsQueryable();
        if (derivativeId.HasValue) query = query.Where(v => v.DerivativeId == derivativeId);
        return await query.OrderBy(x => x.Name).ProjectTo<VariantDto>(mapper.ConfigurationProvider).ToListAsync();
    }

    [HttpGet("options")]
    public async Task<ActionResult<VariantOptionsDto>> GetOptions()
    {
        var transmissions = await context.Transmissions.OrderBy(x => x.Name).ProjectTo<OptionDto>(mapper.ConfigurationProvider).ToListAsync();
        var fuelTypes = await context.FuelTypes.OrderBy(x => x.Name).ProjectTo<OptionDto>(mapper.ConfigurationProvider).ToListAsync();
        var bodyTypes = await context.BodyTypes.OrderBy(x => x.Name).ProjectTo<OptionDto>(mapper.ConfigurationProvider).ToListAsync();
        return new VariantOptionsDto { transmissions = transmissions, fuelTypes = fuelTypes, bodyTypes = bodyTypes };
    }
}