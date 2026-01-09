using ListingService.Data;
using ListingService.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace ListingService.Controllers;

[ApiController]
public class ImagesController(ListingDbContext context, IWebHostEnvironment env) : ControllerBase
{
    [HttpPost("api/listings/{id:int}/images")]
    [RequestSizeLimit(20_000_000)] // ~20MB
    public async Task<ActionResult> Upload(int id)
    {
        var listing = await context.Listings.FindAsync(id);
        if (listing is null) return NotFound("Listing not found");
        if (!Request.HasFormContentType) return BadRequest("Expected multipart/form-data");
        var files = Request.Form.Files;
        if (files.Count == 0) return BadRequest("No files provided");
        if (files.Count > 10) return BadRequest("Too many files (max 10)");

        var saved = new List<ListingImage>();
        var imgRoot = Path.Combine(env.ContentRootPath, "wwwroot", "images", id.ToString());
        var thumbRoot = Path.Combine(imgRoot, "thumbs");
        Directory.CreateDirectory(imgRoot);
        Directory.CreateDirectory(thumbRoot);

        foreach (var f in files)
        {
            if (f.Length <= 0) continue;
            var ct = f.ContentType?.ToLowerInvariant() ?? string.Empty;
            if (!(ct.Contains("image/jpeg") || ct.Contains("image/png") || ct.Contains("image/webp") || ct.Contains("image/gif")))
            {
                return BadRequest($"Unsupported content type: {f.ContentType}");
            }
            var ext = Path.GetExtension(f.FileName);
            var fileName = $"{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(imgRoot, fileName);
            await using (var stream = new FileStream(fullPath, FileMode.Create, FileAccess.Write))
            {
                await f.CopyToAsync(stream);
            }

            // Generate thumbnail (max width 400px)
            string? thumbUrl = null;
            try
            {
                using var image = await Image.LoadAsync(fullPath);
                var w = image.Width;
                var h = image.Height;
                var maxW = 400;
                if (w > maxW)
                {
                    var ratio = (double)maxW / w;
                    var newW = maxW;
                    var newH = (int)Math.Round(h * ratio);
                    image.Mutate(x => x.Resize(newW, newH));
                }
                var thumbName = $"thumb-{fileName}";
                var thumbPath = Path.Combine(thumbRoot, thumbName);
                await image.SaveAsync(thumbPath);
                thumbUrl = $"/images/{id}/thumbs/{thumbName}";
            }
            catch
            {
                // ignore thumbnail generation failures
            }

            var url = $"/images/{id}/{fileName}";
            var entity = new ListingImage { ListingId = id, FileName = fileName, Url = url, ThumbUrl = thumbUrl, CreatedAt = DateTime.UtcNow };
            context.ListingImages.Add(entity);
            saved.Add(entity);
        }
        await context.SaveChangesAsync();
        return Ok(saved.Select(x => new { x.Id, x.FileName, x.Url }));
    }

    [HttpGet("api/listings/{id:int}/images")]
    public async Task<ActionResult<IEnumerable<object>>> GetImages(int id)
    {
        var exists = await context.Listings.AnyAsync(l => l.Id == id);
        if (!exists) return NotFound("Listing not found");
        var list = await context.ListingImages.Where(i => i.ListingId == id)
                                              .OrderByDescending(i => i.Id)
                                              .Select(i => new { i.Id, i.FileName, i.Url })
                                              .ToListAsync();
        return Ok(list);
    }

    [HttpDelete("api/listings/{listingId:int}/images/{imageId:int}")]
    public async Task<ActionResult> DeleteImage(int listingId, int imageId)
    {
        var image = await context.ListingImages.FirstOrDefaultAsync(i => i.Id == imageId && i.ListingId == listingId);
        if (image is null) return NotFound();
        var fullPath = Path.Combine(env.ContentRootPath, "wwwroot", image.Url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        try { if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath); } catch { /* ignore */ }
        context.ListingImages.Remove(image);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
