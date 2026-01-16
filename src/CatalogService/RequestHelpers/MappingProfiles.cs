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
        CreateMap<CreateVariantDto, Variant>()
            .ForMember(d => d.Id, o => o.Ignore());
        CreateMap<Feature, FeatureDto>();
        CreateMap<CreateFeatureDto, Feature>().ForMember(d => d.Id, o => o.Ignore());
        CreateMap<VariantFeature, VariantFeatureDto>();

        // Derivative - map via constructor parameters for ProjectTo support
        CreateMap<Derivative, DerivativeDto>()
            .ForCtorParam("BodyType", o => o.MapFrom(s => s.BodyTypeRef != null ? s.BodyTypeRef.Name : null))
            .ForCtorParam("DriveType", o => o.MapFrom(s => s.DriveTypeRef != null ? s.DriveTypeRef.Name : null))
            .ForCtorParam("Transmission", o => o.MapFrom(s => s.TransmissionRef != null ? s.TransmissionRef.Name : null))
            .ForCtorParam("FuelType", o => o.MapFrom(s => s.FuelTypeRef != null ? s.FuelTypeRef.Name : null));
        CreateMap<CreateDerivativeDto, Derivative>()
            .ForMember(d => d.Id, o => o.Ignore());
    }
}
