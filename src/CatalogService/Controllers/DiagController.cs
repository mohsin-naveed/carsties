using CatalogService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/diag")] 
public class DiagController(CatalogDbContext context) : ControllerBase
{
    [HttpGet("counts")]
    public async Task<ActionResult<object>> GetCounts()
    {
        var makes = await context.Makes.CountAsync();
        var models = await context.Models.CountAsync();
        var generations = await context.Generations.CountAsync();
        var derivatives = await context.Derivatives.CountAsync();
        var variants = await context.Variants.CountAsync();
        return Ok(new { makes, models, generations, derivatives, variants });
    }
}
