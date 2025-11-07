using AutoMapper;
using CatalogService.DTOs;
using CatalogService.Entities;

namespace CatalogService.RequestHelpers;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<Make, MakeDto>();
        CreateMap<CreateMakeDto, Make>().ForMember(d => d.Id, o => o.Ignore());
        CreateMap<Model, ModelDto>();
        CreateMap<CreateModelDto, Model>().ForMember(d => d.Id, o => o.Ignore());
        CreateMap<Generation, GenerationDto>();
        CreateMap<CreateGenerationDto, Generation>().ForMember(d => d.Id, o => o.Ignore());
        CreateMap<Variant, VariantDto>();
        CreateMap<CreateVariantDto, Variant>().ForMember(d => d.Id, o => o.Ignore());
        CreateMap<Feature, FeatureDto>();
        CreateMap<CreateFeatureDto, Feature>().ForMember(d => d.Id, o => o.Ignore());
        CreateMap<VariantFeature, VariantFeatureDto>();
    }
}
