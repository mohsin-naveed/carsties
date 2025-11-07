using AutoMapper;
using AutoMapper.QueryableExtensions;
using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Entities;
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

        var make = mapper.Map<Make>(dto);
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
        if (!string.IsNullOrWhiteSpace(dto.Name)) make.Name = dto.Name;
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
