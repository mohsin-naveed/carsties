using CatalogService.Data;
using CatalogService.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DriveTypesController(CatalogDbContext context) : ControllerBase
{
    [HttpGet("options")]
    public ActionResult<List<OptionDto>> GetOptions()
    {
        var items = context.DriveTypes
            .OrderBy(x => x.Code)
            .Select(x => new OptionDto(x.Id, x.Name, x.Code))
            .ToList();
        return Ok(items);
    }
}
