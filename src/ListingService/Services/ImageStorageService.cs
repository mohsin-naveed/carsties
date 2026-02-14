using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Gif;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;

namespace ListingService.Services;

public interface IImageStorageService
{
    Task<(string Url, string? ThumbUrl, string FileName)> SaveListingImageAsync(int listingId, IFormFile file, CancellationToken cancellationToken = default);
    Task DeleteListingImageAsync(int listingId, string fileName, string? thumbUrl, CancellationToken cancellationToken = default);
    Task DeleteAllListingImagesAsync(int listingId, CancellationToken cancellationToken = default);
}

public class AzureBlobImageStorageService : IImageStorageService
{
    private readonly BlobContainerClient _container;
    private readonly string _baseUrl;

    public AzureBlobImageStorageService(IConfiguration config)
    {
        var section = config.GetSection("BlobStorage");
        var connectionString = section.GetValue<string>("ConnectionString") ?? string.Empty;
        var containerName = section.GetValue<string>("ContainerName") ?? "images";
        _baseUrl = section.GetValue<string>("BaseUrl") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("BlobStorage:ConnectionString configuration is missing.");
        }
        if (string.IsNullOrWhiteSpace(_baseUrl))
        {
            throw new InvalidOperationException("BlobStorage:BaseUrl configuration is missing.");
        }

        _baseUrl = _baseUrl.TrimEnd('/');
        _container = new BlobContainerClient(connectionString, containerName);
    }

    public async Task<(string Url, string? ThumbUrl, string FileName)> SaveListingImageAsync(int listingId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var blobName = $"{listingId}/{fileName}";

        // Load into memory once so we can both validate/process and upload
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, cancellationToken);
        var bytes = ms.ToArray();

        // Upload original
        var blobClient = _container.GetBlobClient(blobName);
        using (var uploadStream = new MemoryStream(bytes))
        {
            var headers = new BlobHttpHeaders { ContentType = file.ContentType };
            await blobClient.UploadAsync(uploadStream, headers, cancellationToken: cancellationToken);
        }
        var url = $"{_baseUrl}/{blobName}";

        // Generate and upload thumbnail (max width 400px)
        string? thumbUrl = null;
        try
        {
            using var image = Image.Load(bytes);
            var maxW = 400;
            if (image.Width > maxW)
            {
                var ratio = (double)maxW / image.Width;
                var newW = maxW;
                var newH = (int)Math.Round(image.Height * ratio);
                image.Mutate(x => x.Resize(newW, newH));
            }

            using var thumbStream = new MemoryStream();
            var extLower = ext.ToLowerInvariant();
            IImageEncoder encoder = extLower switch
            {
                ".png" => new PngEncoder(),
                ".webp" => new WebpEncoder(),
                ".gif" => new GifEncoder(),
                _ => new JpegEncoder()
            };

            await image.SaveAsync(thumbStream, encoder, cancellationToken);
            thumbStream.Position = 0;

            var thumbFileName = $"thumb-{fileName}";
            var thumbBlobName = $"{listingId}/thumbs/{thumbFileName}";
            var thumbClient = _container.GetBlobClient(thumbBlobName);
            var headers = new BlobHttpHeaders { ContentType = file.ContentType };
            await thumbClient.UploadAsync(thumbStream, headers, cancellationToken: cancellationToken);

            thumbUrl = $"{_baseUrl}/{thumbBlobName}";
        }
        catch
        {
            // ignore thumbnail failures; original upload already succeeded
        }

        return (url, thumbUrl, fileName);
    }

    public async Task DeleteListingImageAsync(int listingId, string fileName, string? thumbUrl, CancellationToken cancellationToken = default)
    {
        var blobName = $"{listingId}/{fileName}";
        var blobClient = _container.GetBlobClient(blobName);
        await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: cancellationToken);

        // Attempt to delete thumbnail based on naming convention
        var thumbFileName = $"thumb-{fileName}";
        var thumbBlobName = $"{listingId}/thumbs/{thumbFileName}";
        var thumbClient = _container.GetBlobClient(thumbBlobName);
        await thumbClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: cancellationToken);
    }

    public async Task DeleteAllListingImagesAsync(int listingId, CancellationToken cancellationToken = default)
    {
        var prefix = $"{listingId}/";
        await foreach (var blob in _container.GetBlobsAsync(prefix: prefix, cancellationToken: cancellationToken))
        {
            try
            {
                var blobClient = _container.GetBlobClient(blob.Name);
                await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: cancellationToken);
            }
            catch
            {
                // Best-effort: leaving a blob behind should not block account deletion.
            }
        }
    }
}
