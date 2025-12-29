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
        CreateMap<Variant, VariantDto>()
            .ForMember(d => d.Transmission, o => o.MapFrom(s => s.TransmissionRef != null ? s.TransmissionRef.Name : null))
            .ForMember(d => d.FuelType, o => o.MapFrom(s => s.FuelTypeRef != null ? s.FuelTypeRef.Name : null));
        CreateMap<CreateVariantDto, Variant>()
            .ForMember(d => d.Id, o => o.Ignore());
        CreateMap<Feature, FeatureDto>();
        CreateMap<CreateFeatureDto, Feature>().ForMember(d => d.Id, o => o.Ignore());
        CreateMap<VariantFeature, VariantFeatureDto>();

        // ModelBody - map via constructor parameters for ProjectTo support
        CreateMap<ModelBody, ModelBodyDto>()
            .ForCtorParam("BodyType", o => o.MapFrom(s => s.BodyTypeRef != null ? s.BodyTypeRef.Name : null));
        CreateMap<CreateModelBodyDto, ModelBody>()
            .ForMember(d => d.Id, o => o.Ignore());
    }
}
