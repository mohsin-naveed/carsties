using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace ListingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[ApiExplorerSettings(IgnoreApi = true)]
[Obsolete("Deprecated: Reference data comes from CatalogService. These endpoints return 410 and will be removed.")]
public class ReferencesController : ControllerBase
{
    private ActionResult Gone(string endpoint) => StatusCode(StatusCodes.Status410Gone, $"Deprecated endpoint '{endpoint}'. Use CatalogService.");

    [HttpGet("makes")] public ActionResult GetMakes() => Gone("makes");
    [HttpGet("models")] public ActionResult GetModels() => Gone("models");
    [HttpGet("generations")] public ActionResult GetGenerations() => Gone("generations");
    [HttpGet("derivatives")] public ActionResult GetDerivatives() => Gone("derivatives");
    [HttpGet("variants")] public ActionResult GetVariants() => Gone("variants");
    [HttpGet("options")] public ActionResult GetOptions() => Gone("options");
}