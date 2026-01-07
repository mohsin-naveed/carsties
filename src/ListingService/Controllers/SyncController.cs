using ListingService.Data;
using ListingService.Services;
using Microsoft.AspNetCore.Mvc;

namespace ListingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[ApiExplorerSettings(IgnoreApi = true)]
public class SyncController(ListingDbContext context, CatalogSyncService sync) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult> Post()
    {
        try
        {
            await sync.SyncReferenceDataAsync(context);
            return Ok(new { status = "synced" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
