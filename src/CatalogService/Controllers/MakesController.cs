using AutoMapper;
using AutoMapper.QueryableExtensions;
using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Entities;
using CatalogService.RequestHelpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MakesController(CatalogDbContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MakeDto>>> GetAll()
    {
        return await context.Makes
            .OrderBy(x => x.Name)
            .ProjectTo<MakeDto>(mapper.ConfigurationProvider)
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MakeDto>> Get(int id)
    {
        var make = await context.Makes.FindAsync(id);
        return make is null ? NotFound() : mapper.Map<MakeDto>(make);
    }

    [HttpPost]
    public async Task<ActionResult<MakeDto>> Create(CreateMakeDto dto)
    {
        if (await context.Makes.AnyAsync(x => x.Name == dto.Name))
            return Conflict($"Make '{dto.Name}' already exists");

        var make = new Make { Name = dto.Name, Country = dto.Country, IsActive = dto.IsActive ?? true, IsPopular = dto.IsPopular ?? false, Code = CodeGenerator.MakeCode(dto.Name) };
        if (!await CodeGenerator.IsCodeUniqueAsync(context, "Makes", make.Code))
            return Conflict($"Code '{make.Code}' already exists");
        context.Makes.Add(make);
        var ok = await context.SaveChangesAsync() > 0;
        if (!ok) return BadRequest("Failed to create make");
        var result = mapper.Map<MakeDto>(make);
        return CreatedAtAction(nameof(Get), new { id = make.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, UpdateMakeDto dto)
    {
        var make = await context.Makes.FindAsync(id);
        if (make is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            make.Name = dto.Name;
            make.Code = CodeGenerator.MakeCode(dto.Name);
            if (!await CodeGenerator.IsCodeUniqueAsync(context, "Makes", make.Code, id))
                return Conflict($"Code '{make.Code}' already exists");
        }
        if (dto.Country is not null) make.Country = dto.Country;
        if (dto.IsActive.HasValue) make.IsActive = dto.IsActive.Value;
        if (dto.IsPopular.HasValue) make.IsPopular = dto.IsPopular.Value;
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to update make");
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var make = await context.Makes.FindAsync(id);
        if (make is null) return NotFound();
        context.Makes.Remove(make);
        var ok = await context.SaveChangesAsync() > 0;
        return ok ? Ok() : BadRequest("Failed to delete make");
    }
}
