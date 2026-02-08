using ListingService.Data;
using ListingService.Entities;
using ListingService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ListingService.Controllers;

[ApiController]
public class ImagesController(ListingDbContext context, IImageStorageService imageStorage) : ControllerBase
{
    [HttpPost("api/listings/{id:int}/images")]
    [RequestSizeLimit(20_000_000)] // ~20MB
    [Authorize]
    public async Task<ActionResult> Upload(int id, CancellationToken cancellationToken)
    {
        var listing = await context.Listings.FindAsync(new object[] { id }, cancellationToken);
        if (listing is null) return NotFound("Listing not found");
        var ownerId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId) || !string.Equals(listing.OwnerId, ownerId, StringComparison.Ordinal))
        {
            return Forbid();
        }
        if (!Request.HasFormContentType) return BadRequest("Expected multipart/form-data");
        var files = Request.Form.Files;
        if (files.Count == 0) return BadRequest("No files provided");
        if (files.Count > 10) return BadRequest("Too many files (max 10)");

        var saved = new List<ListingImage>();

        foreach (var f in files)
        {
            if (f.Length <= 0) continue;
            var ct = f.ContentType?.ToLowerInvariant() ?? string.Empty;
            if (!(ct.Contains("image/jpeg") || ct.Contains("image/png") || ct.Contains("image/webp") || ct.Contains("image/gif")))
            {
                return BadRequest($"Unsupported content type: {f.ContentType}");
            }
            var (url, thumbUrl, fileName) = await imageStorage.SaveListingImageAsync(id, f, cancellationToken);
            var entity = new ListingImage { ListingId = id, FileName = fileName, Url = url, ThumbUrl = thumbUrl, CreatedAt = DateTime.UtcNow };
            context.ListingImages.Add(entity);
            saved.Add(entity);
        }
        await context.SaveChangesAsync();
        return Ok(saved.Select(x => new { x.Id, x.FileName, x.Url }));
    }

    [HttpGet("api/listings/{id:int}/images")]
    public async Task<ActionResult<IEnumerable<object>>> GetImages(int id, CancellationToken cancellationToken)
    {
        var exists = await context.Listings.AnyAsync(l => l.Id == id, cancellationToken);
        if (!exists) return NotFound("Listing not found");
        var list = await context.ListingImages.Where(i => i.ListingId == id)
                                              .OrderByDescending(i => i.Id)
                                              .Select(i => new { i.Id, i.FileName, i.Url })
                                              .ToListAsync(cancellationToken);
        return Ok(list);
    }

    [HttpDelete("api/listings/{listingId:int}/images/{imageId:int}")]
    [Authorize]
    public async Task<ActionResult> DeleteImage(int listingId, int imageId, CancellationToken cancellationToken)
    {
        var image = await context.ListingImages.FirstOrDefaultAsync(i => i.Id == imageId && i.ListingId == listingId, cancellationToken);
        if (image is null) return NotFound();
        var listing = await context.Listings.FirstOrDefaultAsync(l => l.Id == listingId, cancellationToken);
        if (listing is null) return NotFound();
        var ownerId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId) || !string.Equals(listing.OwnerId, ownerId, StringComparison.Ordinal))
        {
            return Forbid();
        }
        await imageStorage.DeleteListingImageAsync(listingId, image.FileName, image.ThumbUrl, cancellationToken);
        context.ListingImages.Remove(image);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
