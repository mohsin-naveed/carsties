using AutoMapper;
using AutoMapper.QueryableExtensions;
using CatalogService.Data;
using CatalogService.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeatureCategoriesController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<OptionDto>>> GetAll()
    {
        return await context.FeatureCategories
            .OrderBy(x => x.Name)
            .ProjectTo<OptionDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("options")]
    public async Task<ActionResult<List<OptionDto>>> Options() => await GetAll();
}
